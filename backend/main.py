"""
ManganeseAI - FastAPI Backend Server
Exposes existing Python ML models via REST APIs for the React.js + Vite frontend.
"""

import os
import sys
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure stdout/stderr handles UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from src.data_generator import DATA_DIR
from src.pipeline import ManganeseAIPipeline
from src.simulator import WhatIfSimulator
from src.explainability_engine import ExplainableAIEngine
from src.environmental_engine import EnvironmentalIntelligenceEngine
from src.decision_engine import AIDecisionEngine
from backend.auth_service import register_user, login_user
from src.ingest import (
    parse_uploaded_file,
    auto_map_columns,
    validate_dataset,
    clean_dataset,
    evaluate_ml_compatibility,
    run_ml_inference_on_uploaded_dataset,
    generate_template_csv,
    create_upload_session,
    get_upload_session,
    set_active_session,
    get_active_session,
    clear_active_session,
    STANDARD_FIELDS,
    MAX_UPLOAD_SIZE_BYTES
)

app = FastAPI(
    title="ManganeseAI Backend API",
    description="Explainable Mining Intelligence REST API for Reserve Estimation, Production Forecasting & Risk Analysis",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pipeline engines
pipeline = ManganeseAIPipeline()
try:
    df_zones, df_prod, df_equipment = pipeline.load_all_engines()
except Exception:
    pipeline.run_full_pipeline()
    df_zones, df_prod, df_equipment = pipeline.load_all_engines()

simulator = WhatIfSimulator(pipeline.prod_engine, pipeline.shortfall_engine)
xai_engine = ExplainableAIEngine()
env_engine = EnvironmentalIntelligenceEngine()
decision_engine = AIDecisionEngine(simulator_obj=simulator)

# Helper: Enrich zone dict with continuous, zone-unique operational parameters across all zones
def enrich_zone_data(row_dict: dict, idx: int = 0) -> dict:
    z_copy = row_dict.copy()
    grade = float(z_copy.get("geol_grade_pct", 35.0))
    drill = float(z_copy.get("drill_depth_m", 100.0))
    ore_thick = float(z_copy.get("ore_thickness_m", 15.0))
    fault_prox = float(z_copy.get("fault_proximity_km", 5.0))
    zone_id = str(z_copy.get("zone_id", ""))
    z_num = int(''.join(filter(str.isdigit, zone_id)) or (idx + 1))
    
    # 3 operational risk tiers (Low, Medium, High) with smooth continuous zone-unique variations
    tier = (z_num - 1) % 3  # 0=LOW, 1=MEDIUM, 2=HIGH
    
    # Zone-unique fractional offsets based on zone ID number
    u_off1 = ((z_num * 17) % 13) / 13.0  # 0.0 to 0.92
    u_off2 = ((z_num * 23) % 11) / 11.0  # 0.0 to 0.90
    u_off3 = ((z_num * 31) % 19) / 19.0  # 0.0 to 0.94
    
    if tier == 0:
        # LOW RISK profile: low downtime, high availability, minimal blasting delay
        downtime = round(0.8 + u_off1 * 1.5 + (drill / 220.0 * 0.5), 1)
        availability = round(96.0 - u_off2 * 4.0 - downtime * 0.8, 1)
        maint_hrs = round(1.0 + u_off3 * 1.2, 1)
        blast_delay = round(u_off1 * 0.8, 1)
    elif tier == 1:
        # MEDIUM RISK profile: moderate downtime and availability
        downtime = round(3.2 + u_off1 * 2.2 + (fault_prox / 12.0 * 0.6), 1)
        availability = round(88.5 - u_off2 * 4.5 - downtime * 0.6, 1)
        maint_hrs = round(2.5 + u_off3 * 1.8, 1)
        blast_delay = round(1.0 + u_off1 * 1.2, 1)
    else:
        # HIGH RISK profile: heavy downtime, lower availability, severe blasting delay
        downtime = round(7.5 + u_off1 * 6.5 + (drill / 220.0 * 2.0), 1)
        availability = round(76.0 - u_off2 * 12.0 - downtime * 0.5, 1)
        maint_hrs = round(4.5 + u_off3 * 3.5, 1)
        blast_delay = round(2.5 + u_off1 * 3.5, 1)
        
    target_m = round(8500.0 + z_num * 150.0 + ore_thick * 40.0 + u_off2 * 500.0, -2)
    hist_m = round(30.0 * (220.0 + grade * 2.2 + ore_thick * 2.5 - downtime * 6.0 + u_off3 * 15.0), 0)
    
    z_copy["geological_indicator"] = round(grade / 48.0, 3)
    z_copy["equipment_downtime"] = downtime
    z_copy["equipment_availability"] = availability
    z_copy["maintenance_hours"] = maint_hrs
    z_copy["blasting_delay"] = blast_delay
    z_copy["historical_production"] = hist_m
    z_copy["production_target"] = target_m
    
    return z_copy

# Input Schemas
class ReserveInput(BaseModel):
    zone_id: Optional[str] = "Z01"
    latitude: Optional[float] = 21.3747
    longitude: Optional[float] = 80.0318
    elevation_m: Optional[float] = 286.3
    geol_grade_pct: Optional[float] = 45.25
    lithology_score: Optional[float] = 6.82
    fault_proximity_km: Optional[float] = 3.67
    ore_thickness_m: Optional[float] = 4.5
    drill_depth_m: Optional[float] = 128.1
    mineralization_density: Optional[float] = 1.57
    rainfall_mm: Optional[float] = 1394.0
    soil_moisture_pct: Optional[float] = 32.9
    ndvi: Optional[float] = 0.461
    land_surface_temp_c: Optional[float] = 26.9

class ProductionInput(BaseModel):
    historical_production: Optional[float] = 9800.0
    previous_production: Optional[float] = 9800.0
    production_trend: Optional[float] = 0.0
    equipment_availability: Optional[float] = 75.0
    equipment_downtime: Optional[float] = 18.0
    maintenance_hours: Optional[float] = 5.0
    rainfall: Optional[float] = 12.8
    soil_moisture: Optional[float] = 42.0
    temperature: Optional[float] = 31.0
    blasting_delay: Optional[float] = 8.0
    production_target: Optional[float] = 10000.0

class ShortfallInput(BaseModel):
    equipment_downtime: Optional[float] = 18.0
    equipment_availability: Optional[float] = 75.0
    maintenance_hours: Optional[float] = 5.0
    rainfall: Optional[float] = 12.8
    blasting_delay: Optional[float] = 8.0
    historical_production: Optional[float] = 9800.0
    production_trend: Optional[float] = 0.0
    temperature: Optional[float] = 31.0
    soil_moisture: Optional[float] = 42.0
    production_target: Optional[float] = 10000.0

class SimulationRequest(BaseModel):
    baseline: Dict[str, Any]
    modified: Dict[str, Any]


class RegisterInput(BaseModel):
    full_name: str
    email: str
    password: str
    confirm_password: Optional[str] = None
    role: Optional[str] = "Mining Analyst"

class LoginInput(BaseModel):
    email: str
    password: str

class ValidateRequest(BaseModel):
    session_id: str
    column_mapping: Dict[str, Optional[str]]

class CleanRequest(BaseModel):
    session_id: str
    column_mapping: Optional[Dict[str, Optional[str]]] = None
    drop_invalid_rows: bool = False
    impute_numeric_median: bool = True
    remove_duplicates: bool = True
    normalize_zone_ids: bool = True

class AnalyzeUploadedRequest(BaseModel):
    session_id: str


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ManganeseAI Backend ML API"}

# =========================================================
# AUTHENTICATION & DIRECT REGISTRATION ENDPOINTS
# =========================================================

@app.post("/api/auth/register")
@app.post("/api/auth/register-init")
def register_endpoint(data: RegisterInput):
    if not data.full_name or not data.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not data.email or not data.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")
    if not data.password or len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    if data.confirm_password and data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    try:
        res = register_user(data.full_name, data.email, data.password, data.role)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
def login_endpoint(data: LoginInput):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    try:
        res = login_user(data.email, data.password)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/zones")
def get_zones():
    """Returns all available mining zones with enriched parameters and ML predictions."""
    active_session = get_active_session()
    if active_session and active_session.get("zones_result"):
        zones = active_session["zones_result"]
        val_res = active_session.get("validation_res") or {}
        return {
            "count": len(zones),
            "zones": zones,
            "is_uploaded": True,
            "filename": active_session.get("filename"),
            "confidence_score": val_res.get("confidence_score", 100),
            "rating": val_res.get("rating", "HIGH")
        }

    zones_list = []
    for idx, row in df_zones.iterrows():
        z_dict = enrich_zone_data(row.to_dict(), idx)
        pred = pipeline.reserve_engine.predict_zone(z_dict)
        z_dict["predicted_score"] = pred["potential_score"]
        z_dict["predicted_class"] = pred["potential_class"]
        z_dict["predicted_confidence"] = pred["confidence_pct"]
        z_dict["potential_score"] = pred["potential_score"]
        z_dict["potential_class"] = pred["potential_class"]

        # Calculate production forecast & shortfall risk for data consistency across all components
        prod_dict = {
            "historical_production": z_dict["historical_production"] / 30.0,
            "previous_production": z_dict["historical_production"] / 30.0,
            "production_trend": 0.0,
            "equipment_availability": z_dict["equipment_availability"],
            "equipment_downtime": z_dict["equipment_downtime"],
            "maintenance_hours": z_dict["maintenance_hours"],
            "rainfall": z_dict["rainfall_mm"] / 10.0,
            "soil_moisture": z_dict["soil_moisture_pct"],
            "temperature": z_dict["land_surface_temp_c"],
            "blasting_delay": z_dict["blasting_delay"],
            "production_target": z_dict["production_target"] / 30.0
        }
        f_res = pipeline.prod_engine.forecast(prod_dict)
        monthly_forecast = round(f_res["predicted_production"] * 30.0, 0)
        monthly_target = z_dict["production_target"]
        
        r_res = pipeline.shortfall_engine.predict_risk(
            prod_dict,
            target_prod=monthly_target / 30.0,
            forecast_prod=f_res["predicted_production"]
        )
        expected_shortfall = max(0.0, monthly_target - monthly_forecast)
        
        z_dict["predicted_production_monthly"] = monthly_forecast
        z_dict["shortfall_risk_level"] = r_res["risk_level"]
        z_dict["shortfall_probability_pct"] = r_res["shortfall_probability_pct"]
        z_dict["expected_shortfall_monthly"] = expected_shortfall

        zones_list.append(z_dict)
    return {"count": len(zones_list), "zones": zones_list, "is_uploaded": False}

@app.get("/api/zones/{zone_id}")
def get_zone_by_id(zone_id: str):
    """Fetches zone by ID and runs full ML pipeline analysis."""
    active_session = get_active_session()
    if active_session and active_session.get("zones_result"):
        uploaded_zones = active_session["zones_result"]
        match_z = next((z for z in uploaded_zones if str(z.get("zone_id")).upper() == str(zone_id).upper()), None)
        if match_z:
            monthly_forecast = match_z.get("predicted_production_monthly", 0.0)
            monthly_target = match_z.get("production_target", 10000.0)
            monthly_gap = max(0.0, monthly_target - monthly_forecast)
            achievement_pct = round((monthly_forecast / monthly_target) * 100.0, 1) if monthly_target > 0 else 100.0

            try:
                eq_res = pipeline.equipment_engine.get_zone_equipment_predictions(zone_id)
            except Exception:
                eq_res = {"equipment_count": 0, "high_risk_count": 0, "medium_risk_count": 0, "low_risk_count": 0, "equipment": []}

            return {
                "zone_data": match_z,
                "reserve_prediction": {
                    "potential_score": match_z.get("potential_score", 50.0),
                    "potential_class": match_z.get("potential_class", "MEDIUM POTENTIAL"),
                    "confidence_pct": match_z.get("predicted_confidence", 85.0)
                },
                "production_prediction": {
                    "predicted_production_daily": round(monthly_forecast / 30.0, 1),
                    "predicted_production_monthly": monthly_forecast,
                    "target_production_monthly": monthly_target,
                    "production_gap_monthly": monthly_gap,
                    "achievement_pct": achievement_pct,
                    "metrics": pipeline.prod_engine.metrics.get("all_models", {})
                },
                "shortfall_prediction": {
                    "risk_level": match_z.get("shortfall_risk_level", "MEDIUM"),
                    "shortfall_probability_pct": match_z.get("shortfall_probability_pct", 40.0),
                    "expected_shortfall_monthly": match_z.get("expected_shortfall_monthly", monthly_gap)
                },
                "equipment_summary": {
                    "equipment_count": eq_res.get("equipment_count", 0),
                    "high_risk_count": eq_res.get("high_risk_count", 0),
                    "medium_risk_count": eq_res.get("medium_risk_count", 0),
                    "low_risk_count": eq_res.get("low_risk_count", 0),
                    "top_high_risk_machine": eq_res["equipment"][0]["equipment_id"] if eq_res.get("equipment") else None
                }
            }

    match = df_zones[df_zones["zone_id"] == zone_id]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found.")
    
    idx = match.index[0]
    z_dict = enrich_zone_data(match.iloc[0].to_dict(), idx)
    
    # Run predictions
    res_pred = pipeline.reserve_engine.predict_zone(z_dict)
    
    prod_dict = {
        "historical_production": z_dict["historical_production"] / 30.0,
        "previous_production": z_dict["historical_production"] / 30.0,
        "production_trend": 0.0,
        "equipment_availability": z_dict["equipment_availability"],
        "equipment_downtime": z_dict["equipment_downtime"],
        "maintenance_hours": z_dict["maintenance_hours"],
        "rainfall": z_dict["rainfall_mm"] / 10.0,
        "soil_moisture": z_dict["soil_moisture_pct"],
        "temperature": z_dict["land_surface_temp_c"],
        "blasting_delay": z_dict["blasting_delay"],
        "production_target": z_dict["production_target"] / 30.0
    }
    
    f_res = pipeline.prod_engine.forecast(prod_dict)
    monthly_forecast = round(f_res["predicted_production"] * 30.0, 0)
    monthly_target = z_dict["production_target"]
    monthly_gap = round(monthly_target - monthly_forecast, 0) if monthly_target > monthly_forecast else 0.0
    achievement_pct = round((monthly_forecast / monthly_target) * 100.0, 1) if monthly_target > 0 else 100.0
    
    r_res = pipeline.shortfall_engine.predict_risk(
        prod_dict,
        target_prod=z_dict["production_target"] / 30.0,
        forecast_prod=f_res["predicted_production"]
    )
    
    expected_shortfall = max(0.0, monthly_target - monthly_forecast)

    r_res["expected_shortfall_monthly"] = expected_shortfall
    z_dict["shortfall_risk_level"] = r_res["risk_level"]
    z_dict["shortfall_probability_pct"] = r_res["shortfall_probability_pct"]
    z_dict["expected_shortfall_monthly"] = expected_shortfall

    # Equipment failure predictions for this zone
    eq_res = pipeline.equipment_engine.get_zone_equipment_predictions(zone_id)

    return {
        "zone_data": z_dict,
        "reserve_prediction": res_pred,
        "production_prediction": {
            "predicted_production_daily": f_res["predicted_production"],
            "predicted_production_monthly": monthly_forecast,
            "target_production_monthly": monthly_target,
            "production_gap_monthly": monthly_gap,
            "achievement_pct": achievement_pct,
            "metrics": pipeline.prod_engine.metrics.get("all_models", {})
        },
        "shortfall_prediction": r_res,
        "equipment_summary": {
            "equipment_count": eq_res.get("equipment_count", 0),
            "high_risk_count": eq_res.get("high_risk_count", 0),
            "medium_risk_count": eq_res.get("medium_risk_count", 0),
            "low_risk_count": eq_res.get("low_risk_count", 0),
            "top_high_risk_machine": eq_res["equipment"][0]["equipment_id"] if eq_res.get("equipment") else None
        }
    }

@app.get("/api/production")
def get_production_history():
    """Returns time-series production records."""
    records = df_prod.tail(180).to_dict(orient="records")
    return {"count": len(records), "data": records}

@app.get("/api/summary")
def get_summary():
    """Returns region-wide summary metrics."""
    active_session = get_active_session()
    if active_session and active_session.get("zones_result"):
        zones = active_session["zones_result"]
        total_zones = len(zones)
        high_pot_count = sum(1 for z in zones if z.get("potential_class") == "HIGH POTENTIAL")
        current_prod = sum(z.get("historical_production", 0) for z in zones)
        monthly_forecast = sum(z.get("predicted_production_monthly", 0) for z in zones)
        monthly_target = sum(z.get("production_target", 0) for z in zones)
        monthly_gap = max(0.0, monthly_target - monthly_forecast)
        achievement_pct = round((monthly_forecast / monthly_target) * 100.0, 1) if monthly_target > 0 else 100.0
        high_risk_shortfall = sum(1 for z in zones if z.get("shortfall_risk_level") == "HIGH")
        avg_risk_prob = round(sum(z.get("shortfall_probability_pct", 0) for z in zones) / max(1, total_zones), 1)

        val_res = active_session.get("validation_res") or {}
        return {
            "total_zones": total_zones,
            "high_potential_zones": high_pot_count,
            "high_potential_pct": int(round((high_pot_count / max(1, total_zones)) * 100)),
            "current_production": current_prod,
            "forecast_production": monthly_forecast,
            "production_target": monthly_target,
            "production_gap": monthly_gap,
            "achievement_pct": achievement_pct,
            "shortfall_risk_level": "HIGH" if high_risk_shortfall > total_zones * 0.4 else ("MEDIUM" if high_risk_shortfall > 0 else "LOW"),
            "shortfall_probability_pct": avg_risk_prob,
            "expected_shortfall_tons": monthly_gap,
            "is_uploaded": True,
            "filename": active_session.get("filename"),
            "confidence_score": val_res.get("confidence_score", 100)
        }

    total_zones = len(df_zones)
    high_pot_count = len(df_zones[df_zones["potential_class"] == "HIGH POTENTIAL"])
    
    # Use first zone (Z01) as default baseline
    default_z = enrich_zone_data(df_zones.iloc[0].to_dict(), 0)
    
    prod_dict = {
        "historical_production": default_z["historical_production"] / 30.0,
        "previous_production": default_z["historical_production"] / 30.0,
        "production_trend": 0.0,
        "equipment_availability": default_z["equipment_availability"],
        "equipment_downtime": default_z["equipment_downtime"],
        "maintenance_hours": default_z["maintenance_hours"],
        "rainfall": default_z["rainfall_mm"] / 10.0,
        "soil_moisture": default_z["soil_moisture_pct"],
        "temperature": default_z["land_surface_temp_c"],
        "blasting_delay": default_z["blasting_delay"],
        "production_target": default_z["production_target"] / 30.0
    }
    
    f_res = pipeline.prod_engine.forecast(prod_dict)
    r_res = pipeline.shortfall_engine.predict_risk(
        prod_dict,
        target_prod=default_z["production_target"] / 30.0,
        forecast_prod=f_res["predicted_production"]
    )
    
    monthly_forecast = round(f_res["predicted_production"] * 30.0, 0)
    monthly_target = default_z["production_target"]
    monthly_gap = round(monthly_target - monthly_forecast, 0) if monthly_target > monthly_forecast else 0.0
    achievement_pct = round((monthly_forecast / monthly_target) * 100.0, 1)
    
    return {
        "total_zones": total_zones,
        "high_potential_zones": high_pot_count,
        "high_potential_pct": int(round((high_pot_count / total_zones) * 100)),
        "current_production": default_z["historical_production"],  # Monthly tons
        "forecast_production": monthly_forecast,
        "production_target": monthly_target,
        "production_gap": monthly_gap,
        "achievement_pct": achievement_pct,
        "shortfall_risk_level": r_res["risk_level"] if monthly_forecast < monthly_target else "MEDIUM",
        "shortfall_probability_pct": r_res["shortfall_probability_pct"],
        "expected_shortfall_tons": max(0.0, monthly_target - monthly_forecast),
        "is_uploaded": False
    }

@app.post("/api/predict/reserve")
def predict_reserve(data: ReserveInput):
    try:
        dict_data = data.dict()
        res = pipeline.reserve_engine.predict_zone(dict_data)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/production")
def predict_production(data: ProductionInput):
    try:
        dict_data = data.dict()
        target_monthly = float(data.production_target)
        target_daily = target_monthly / 30.0 if target_monthly > 1000.0 else target_monthly
        dict_data["production_target"] = target_daily
        
        hist_monthly = float(dict_data.get("historical_production", 9800.0))
        hist_daily = hist_monthly / 30.0 if hist_monthly > 1000.0 else hist_monthly
        dict_data["historical_production"] = hist_daily
        dict_data["previous_production"] = hist_daily
        
        res = pipeline.prod_engine.forecast(dict_data)
        
        monthly_forecast = round(res["predicted_production"] * 30.0, 0)
        monthly_gap = round(target_monthly - monthly_forecast, 0) if target_monthly > monthly_forecast else 0.0
        achievement_pct = round((monthly_forecast / target_monthly) * 100.0, 1) if target_monthly > 0 else 100.0
        
        return {
            "predicted_production_daily": res["predicted_production"],
            "predicted_production_monthly": monthly_forecast,
            "target_production_monthly": target_monthly,
            "production_gap_monthly": monthly_gap,
            "achievement_pct": achievement_pct,
            "metrics": pipeline.prod_engine.metrics.get("all_models", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/shortfall")
def predict_shortfall(data: ShortfallInput):
    try:
        dict_data = data.dict()
        target_monthly = float(data.production_target)
        target_daily = target_monthly / 30.0 if target_monthly > 1000.0 else target_monthly
        dict_data["production_target"] = target_daily
        
        hist_monthly = float(dict_data.get("historical_production", 9800.0))
        hist_daily = hist_monthly / 30.0 if hist_monthly > 1000.0 else hist_monthly
        dict_data["historical_production"] = hist_daily
        dict_data["previous_production"] = hist_daily
        
        f_res = pipeline.prod_engine.forecast(dict_data)
        r_res = pipeline.shortfall_engine.predict_risk(
            dict_data,
            target_prod=target_daily,
            forecast_prod=f_res["predicted_production"]
        )
        
        monthly_forecast = round(f_res["predicted_production"] * 30.0, 0)
        monthly_shortfall = max(0.0, target_monthly - monthly_forecast)
        
        r_res["expected_shortfall_monthly"] = monthly_shortfall
        r_res["metrics"] = pipeline.shortfall_engine.metrics.get("all_models", {})
        return r_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate")
def run_simulation(req: SimulationRequest):
    try:
        b_input = req.baseline
        m_params = req.modified
        
        sim_res = simulator.simulate(b_input, m_params)
        
        b_forecast_m = round(sim_res["baseline"]["forecast_production"] * 30.0, 0)
        s_forecast_m = round(sim_res["simulated"]["forecast_production"] * 30.0, 0)
        recovered_m = round(s_forecast_m - b_forecast_m, 0)
        
        target_m = float(b_input.get("production_target", 10000.0))
        
        b_risk = sim_res["baseline"]["risk_level"]
        s_risk = sim_res["simulated"]["risk_level"]
        if s_forecast_m >= target_m:
            s_risk = "LOW"
            
        return {
            "baseline": {
                "forecast_monthly": b_forecast_m,
                "target_monthly": target_m,
                "risk_level": b_risk,
                "shortfall_prob_pct": sim_res["baseline"]["shortfall_prob_pct"]
            },
            "simulated": {
                "forecast_monthly": s_forecast_m,
                "target_monthly": target_m,
                "risk_level": s_risk,
                "shortfall_prob_pct": sim_res["simulated"]["shortfall_prob_pct"]
            },
            "delta": {
                "recovered_production_monthly": recovered_m,
                "risk_reduced": b_risk != s_risk,
                "prob_delta_pct": sim_res["delta"]["prob_delta_pct"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# MODULE 1: SATELLITE & WEATHER INTELLIGENCE ENDPOINTS
# =========================================================

@app.get("/api/environmental/all")
def get_all_zones_environmental():
    """Returns environmental condition rankings for all zones."""
    active_session = get_active_session()
    if active_session and active_session.get("zones_result"):
        df_up = pd.DataFrame(active_session["zones_result"])
        ranked = env_engine.compare_all_zones(df_up, lambda r, idx: r)
        return {"count": len(ranked), "zones": ranked}

    ranked = env_engine.compare_all_zones(df_zones, enrich_zone_data)
    return {"count": len(ranked), "zones": ranked}

@app.get("/api/environmental/{zone_id}")
def get_zone_environmental(zone_id: str):
    """Fetches environmental health score, weather impact, anomalies, and trends for a specific zone."""
    active_session = get_active_session()
    if active_session and active_session.get("zones_result"):
        uploaded_zones = active_session["zones_result"]
        match_z = next((z for z in uploaded_zones if str(z.get("zone_id")).upper() == str(zone_id).upper()), None)
        if match_z:
            df_up = pd.DataFrame(uploaded_zones)
            health_score = env_engine.calculate_health_score(match_z)
            impact = env_engine.predict_weather_impact(match_z)
            anomalies = env_engine.detect_anomalies(match_z, df_up)
            trends = env_engine.get_trends(match_z)
            all_ranking = env_engine.compare_all_zones(df_up, lambda r, idx: r)
            return {
                "zone_id": zone_id,
                "health_score": health_score,
                "weather_impact": impact,
                "anomalies": anomalies,
                "trends": trends,
                "regional_ranking": all_ranking
            }

    match = df_zones[df_zones["zone_id"].str.upper() == str(zone_id).upper()]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found.")

    idx = match.index[0]
    z_dict = enrich_zone_data(match.iloc[0].to_dict(), idx)

    health_score = env_engine.calculate_health_score(z_dict)
    impact = env_engine.predict_weather_impact(z_dict)
    anomalies = env_engine.detect_anomalies(z_dict, df_zones)
    trends = env_engine.get_trends(z_dict)
    all_ranking = env_engine.compare_all_zones(df_zones, enrich_zone_data)

    return {
        "zone_id": zone_id,
        "health_score": health_score,
        "weather_impact": impact,
        "anomalies": anomalies,
        "trends": trends,
        "regional_ranking": all_ranking
    }

# =========================================================
# MODULE 2: EXPLAINABLE AI CENTER (SHAP) ENDPOINTS
# =========================================================

@app.get("/api/explainability/{zone_id}")
def get_explainability(zone_id: str):
    """Calculates SHAP values, waterfall plot data, positive/negative forces, and natural language explanation."""
    match = df_zones[df_zones["zone_id"] == zone_id]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found.")

    idx = match.index[0]
    z_dict = enrich_zone_data(match.iloc[0].to_dict(), idx)

    try:
        explanation = xai_engine.explain_zone(df_zones, z_dict)
        return explanation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/explainability/compare")
def compare_explainability(zone_a: str = "Z01", zone_b: str = "Z07"):
    """Contrasts Zone A vs Zone B feature-by-feature ("What Changed the Prediction?")."""
    match_a = df_zones[df_zones["zone_id"] == zone_a]
    match_b = df_zones[df_zones["zone_id"] == zone_b]

    if match_a.empty or match_b.empty:
        raise HTTPException(status_code=404, detail="Zone A or Zone B not found.")

    z_dict_a = enrich_zone_data(match_a.iloc[0].to_dict(), match_a.index[0])
    z_dict_b = enrich_zone_data(match_b.iloc[0].to_dict(), match_b.index[0])

    try:
        res = xai_engine.compare_zones(z_dict_a, z_dict_b, df_zones)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# MODULE 3: AI RECOMMENDATION & DECISION ENGINE ENDPOINTS
# =========================================================

@app.get("/api/recommendations/{zone_id}")
def get_recommendations(zone_id: str):
    """Generates Risk-to-Action recommendations, Early Warnings, Decision Summary, and Mine Intelligence Score."""
    zone_res = get_zone_by_id(zone_id)
    z_dict = zone_res["zone_data"]

    health_score = env_engine.calculate_health_score(z_dict)
    anomalies = env_engine.detect_anomalies(z_dict, df_zones)

    intel_score = decision_engine.calculate_mining_intelligence_score(
        zone_res["reserve_prediction"],
        zone_res["production_prediction"],
        zone_res["shortfall_prediction"],
        health_score,
        z_dict
    )

    recs = decision_engine.generate_recommendations(
        z_dict,
        zone_res["reserve_prediction"],
        zone_res["production_prediction"],
        zone_res["shortfall_prediction"],
        health_score
    )

    warnings = decision_engine.get_early_warnings(
        z_dict,
        zone_res["shortfall_prediction"],
        anomalies,
        zone_res["production_prediction"]
    )

    summary = decision_engine.get_decision_summary(
        z_dict,
        zone_res["reserve_prediction"],
        zone_res["production_prediction"],
        zone_res["shortfall_prediction"],
        health_score
    )

    return {
        "zone_id": zone_id,
        "mining_intelligence_score": intel_score,
        "recommendations": recs,
        "early_warnings": warnings,
        "decision_summary": summary
    }

@app.get("/api/compare-zones")
def compare_zones(zone_a: str = "Z01", zone_b: str = "Z07"):
    """Compares Zone A vs Zone B across all 5 intelligence pillars and provides AI prioritization recommendation."""
    zone_a_res = get_zone_by_id(zone_a)
    zone_b_res = get_zone_by_id(zone_b)

    # Compute environmental and mine intelligence scores for both
    env_a = env_engine.calculate_health_score(zone_a_res["zone_data"])
    env_b = env_engine.calculate_health_score(zone_b_res["zone_data"])

    score_a = decision_engine.calculate_mining_intelligence_score(
        zone_a_res["reserve_prediction"],
        zone_a_res["production_prediction"],
        zone_a_res["shortfall_prediction"],
        env_a,
        zone_a_res["zone_data"]
    )

    score_b = decision_engine.calculate_mining_intelligence_score(
        zone_b_res["reserve_prediction"],
        zone_b_res["production_prediction"],
        zone_b_res["shortfall_prediction"],
        env_b,
        zone_b_res["zone_data"]
    )

    zone_a_full = {**zone_a_res, "environmental": env_a, "intel_score": score_a}
    zone_b_full = {**zone_b_res, "environmental": env_b, "intel_score": score_b}

    res = decision_engine.compare_zones_prioritization(zone_a_full, zone_b_full)
    return res

@app.get("/api/equipment/{zone_id}")
def get_equipment_by_zone(zone_id: str):
    """
    Automatically retrieves all equipment belonging to the selected zone and uses the trained ML model
    to predict failure probability, risk level, and contributing factors.
    Sorts equipment by failure risk (HIGH risk first).
    """
    res = pipeline.equipment_engine.get_zone_equipment_predictions(zone_id)
    if "error" in res and res["equipment_count"] == 0:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@app.get("/api/equipment/detail/{equipment_id}")
def get_equipment_detail(equipment_id: str):
    """
    Fetches detailed failure analysis, sensor metrics, SHAP/feature importance, and preventive recommendations for a single machine.
    """
    csv_path = os.path.join(DATA_DIR, "equipment_fleet_data.csv")
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Equipment database not found.")
        
    df_fleet = pd.read_csv(csv_path)
    match = df_fleet[df_fleet["equipment_id"] == equipment_id]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Equipment {equipment_id} not found.")

    row = match.iloc[0].to_dict()
    pred = pipeline.equipment_engine.predict_equipment(row)
    
    # Enrich with historical trend
    base_dt = pred["historical_downtime_hrs"] / 6.0
    pred["historical_trend"] = [
        {"month": "Jul", "downtime": round(base_dt * 0.8, 1), "availability": round(min(99, pred["equipment_availability_pct"] + 4), 1)},
        {"month": "Aug", "downtime": round(base_dt * 0.9, 1), "availability": round(min(99, pred["equipment_availability_pct"] + 2), 1)},
        {"month": "Sep", "downtime": round(base_dt * 1.1, 1), "availability": round(max(30, pred["equipment_availability_pct"] - 1), 1)},
        {"month": "Oct", "downtime": round(base_dt * 1.0, 1), "availability": round(pred["equipment_availability_pct"], 1)},
        {"month": "Nov", "downtime": round(base_dt * 1.3, 1), "availability": round(max(30, pred["equipment_availability_pct"] - 3), 1)},
        {"month": "Dec", "downtime": round(base_dt * 1.5, 1), "availability": round(max(30, pred["equipment_availability_pct"] - 5), 1)}
    ]
    return pred


# =========================================================
# DATA UPLOAD, AUTO COLUMN MAPPING & QUALITY CHECK ENDPOINTS
# =========================================================

@app.get("/api/template")
def download_csv_template():
    """Returns a standardized ManganeseAI CSV template for exploration and mine data import."""
    csv_content = generate_template_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ManganeseAI_Data_Template.csv"}
    )


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Accepts CSV, XLSX, XLS file up to 10 MB.
    Parses content, performs automatic fuzzy column mapping with RapidFuzz,
    and initializes an isolated session.
    """
    filename = file.filename or "uploaded_data.csv"
    contents = await file.read()

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10 MB ({len(contents) / (1024*1024):.1f} MB)."
        )

    try:
        df_raw = parse_uploaded_file(contents, filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded file: {str(e)}")

    # Run automatic fuzzy column mapping
    mappings = auto_map_columns(df_raw.columns.tolist())
    auto_matched = sum(1 for m in mappings if m["status"] == "Auto-matched")
    needs_review = sum(1 for m in mappings if m["status"] == "Needs review")
    missing = sum(1 for m in mappings if m["status"] == "Missing")
    summary = {
        "total_standard": len(STANDARD_FIELDS),
        "auto_matched_count": auto_matched,
        "needs_review_count": needs_review,
        "missing_count": missing
    }

    # Create isolated upload session
    session_id = create_upload_session(filename, df_raw, mappings)

    # Prepare preview rows (convert NaN/NaT to None for clean JSON serialization)
    preview_df = df_raw.head(10).replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient="records")

    return {
        "session_id": session_id,
        "filename": filename,
        "row_count": len(df_raw),
        "column_count": len(df_raw.columns),
        "raw_columns": df_raw.columns.tolist(),
        "mappings": mappings,
        "summary": summary,
        "standard_fields": [
            {
                "field": k,
                "label": v["label"],
                "type": v["type"],
                "required": v["required"],
                "description": v["description"]
            }
            for k, v in STANDARD_FIELDS.items()
        ],
        "preview_rows": preview_rows
    }


@app.post("/api/validate")
def validate_dataset_endpoint(data: ValidateRequest):
    """
    Validates uploaded raw dataset against user-reviewed or auto-mapped columns.
    Calculates transparent Data Confidence Score (0-100) and checks ML module compatibility.
    """
    session = get_upload_session(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Upload session not found or expired. Please re-upload your file.")

    df_raw = session["df_raw"]
    mapping = data.column_mapping
    session["column_mapping"] = mapping

    val_res = validate_dataset(df_raw, mapping)
    session["validation_res"] = val_res

    # Check ML compatibility
    active_keys = [k for k, v in mapping.items() if v]
    ml_compat = evaluate_ml_compatibility(active_keys)

    return {
        "session_id": data.session_id,
        "filename": session["filename"],
        "confidence_score": val_res["confidence_score"],
        "score_rating": val_res["score_rating"],
        "score_color": val_res["score_color"],
        "penalties": val_res["penalties"],
        "missing_statistics": val_res["missing_statistics"],
        "issues_summary": val_res["issues_summary"],
        "issues_list": val_res["issues_list"],
        "ml_compatibility": ml_compat,
        "disclaimer": val_res["disclaimer"]
    }


@app.post("/api/clean")
def clean_dataset_endpoint(data: CleanRequest):
    """
    Applies transparent, user-selected data cleaning operations:
    drop invalid rows, impute numeric missing values with median, remove duplicates, normalize zone IDs.
    Returns full change log, before/after statistics, and updated data quality score.
    """
    session = get_upload_session(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Upload session not found or expired.")

    df_raw = session["df_raw"]
    mapping = data.column_mapping if data.column_mapping is not None else session["column_mapping"]

    options = {
        "drop_invalid_rows": data.drop_invalid_rows,
        "impute_numeric_median": data.impute_numeric_median,
        "remove_duplicates": data.remove_duplicates,
        "normalize_zone_ids": data.normalize_zone_ids
    }

    df_cleaned, clean_summary = clean_dataset(df_raw, mapping, options)

    # Validate cleaned dataset to re-compute score
    cleaned_mapping = {col: col for col in df_cleaned.columns}
    cleaned_val = validate_dataset(df_cleaned, cleaned_mapping)

    session["df_cleaned"] = df_cleaned
    session["clean_summary"] = clean_summary
    session["validation_res"] = cleaned_val

    preview_df = df_cleaned.head(10).replace({np.nan: None})
    preview_cleaned = preview_df.to_dict(orient="records")

    return {
        "session_id": data.session_id,
        "before_rows": clean_summary["rows_initial"],
        "after_rows": clean_summary["rows_after"],
        "before_score": session.get("validation_res", {}).get("confidence_score", 0),
        "after_score": cleaned_val["confidence_score"],
        "after_rating": cleaned_val["score_rating"],
        "after_rating_color": cleaned_val["score_color"],
        "changes_log": clean_summary["change_log"],
        "clean_summary": clean_summary,
        "preview_cleaned": preview_cleaned
    }


@app.post("/api/analyze-uploaded")
def analyze_uploaded_dataset(data: AnalyzeUploadedRequest):
    """
    Runs existing ML models (Reserve Intelligence, Production Forecast, Shortfall Risk)
    on the validated/cleaned uploaded dataset and activates it for the session.
    """
    session = get_upload_session(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Upload session not found or expired.")

    df_to_use = session.get("df_cleaned")
    if df_to_use is None:
        mapping = session.get("column_mapping", {})
        rename_dict = {orig_col: std_key for std_key, orig_col in mapping.items() if orig_col}
        df_to_use = session["df_raw"].rename(columns=rename_dict)

    # Run ML inference
    zones_result = run_ml_inference_on_uploaded_dataset(df_to_use, pipeline)

    session["zones_result"] = zones_result
    set_active_session(data.session_id)

    val_res = session.get("validation_res", {})
    confidence_score = val_res.get("confidence_score", 100.0)
    score_rating = val_res.get("score_rating", "HIGH")
    score_color = val_res.get("score_color", "emerald")

    return {
        "success": True,
        "session_id": data.session_id,
        "filename": session["filename"],
        "zone_count": len(zones_result),
        "confidence_score": confidence_score,
        "score_rating": score_rating,
        "score_color": score_color,
        "is_active": True,
        "warning": "ML models were trained on built-in Central Indian ground truth. Predictions on unseen mines should be verified with field observations.",
        "zones": zones_result
    }


@app.post("/api/reset-uploaded")
def reset_uploaded():
    """Switches system back to built-in mine dataset, clearing active uploaded session."""
    clear_active_session()
    return {"success": True, "message": "Switched back to built-in dataset.", "is_active": False}


@app.get("/api/active-upload-status")
def get_active_upload_status():
    """Returns the status of any currently active uploaded dataset."""
    active = get_active_session()
    if not active:
        return {"is_uploaded": False}
    val = active.get("validation_res") or {}
    return {
        "is_uploaded": True,
        "session_id": active["session_id"],
        "filename": active["filename"],
        "confidence_score": val.get("confidence_score", 100),
        "rating": val.get("rating", "HIGH"),
        "rating_color": val.get("rating_color", "green"),
        "zone_count": len(active.get("zones_result") or [])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
