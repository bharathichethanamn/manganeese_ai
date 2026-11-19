"""
ManganeseAI - What-If Production Simulator
Simulates the operational impact of changing parameters (Equipment Downtime, Rainfall, Blasting Delay, Equipment Availability)
by running live predictions through trained ML models.
"""

import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.production_engine import ProductionForecastEngine
from src.shortfall_engine import ShortfallRiskEngine

class WhatIfSimulator:
    def __init__(self, prod_engine=None, shortfall_engine=None):
        self.prod_engine = prod_engine or ProductionForecastEngine()
        self.shortfall_engine = shortfall_engine or ShortfallRiskEngine()
        
        # Ensure models are loaded
        self.prod_engine.load_model()
        self.shortfall_engine.load_model()

    def simulate(self, baseline_input, modified_params):
        """
        Runs before-and-after predictions through trained ML models for modified operational inputs.
        
        Args:
            baseline_input (dict): Dictionary of baseline feature values.
            modified_params (dict): Keys to override (e.g. equipment_downtime, rainfall, blasting_delay, equipment_availability).
        
        Returns:
            dict: Comparison metrics showing before/after forecast, recovered tonnage, and risk transition.
        """
        # 1. Baseline Prediction
        target_prod = float(baseline_input.get("production_target", 350.0))
        baseline_forecast_res = self.prod_engine.forecast(baseline_input)
        baseline_risk_res = self.shortfall_engine.predict_risk(
            baseline_input, 
            target_prod=target_prod, 
            forecast_prod=baseline_forecast_res["predicted_production"]
        )

        # 2. Construct Modified Feature Dict
        simulated_input = baseline_input.copy()
        for k, v in modified_params.items():
            if v is not None:
                simulated_input[k] = float(v)
                
        # Handle secondary coupled adjustments (e.g. if availability changed, update downtime if not explicitly set)
        if "equipment_availability" in modified_params and "equipment_downtime" not in modified_params:
            avail = float(modified_params["equipment_availability"])
            simulated_input["equipment_downtime"] = max(0.0, round((100.0 - avail) / 100.0 * 20.0, 1))

        # 3. Simulated Prediction
        simulated_forecast_res = self.prod_engine.forecast(simulated_input)
        simulated_risk_res = self.shortfall_engine.predict_risk(
            simulated_input,
            target_prod=target_prod,
            forecast_prod=simulated_forecast_res["predicted_production"]
        )

        # 4. Impact Analysis
        baseline_pred = baseline_forecast_res["predicted_production"]
        simulated_pred = simulated_forecast_res["predicted_production"]
        recovered_tons = round(simulated_pred - baseline_pred, 1)

        return {
            "baseline": {
                "forecast_production": baseline_pred,
                "target_production": target_prod,
                "gap_tons": baseline_forecast_res["production_gap"],
                "achievement_pct": baseline_forecast_res["achievement_pct"],
                "risk_level": baseline_risk_res["risk_level"],
                "shortfall_prob_pct": baseline_risk_res["shortfall_probability_pct"],
                "expected_shortfall": baseline_risk_res["expected_shortfall_tons"]
            },
            "simulated": {
                "forecast_production": simulated_pred,
                "target_production": target_prod,
                "gap_tons": simulated_forecast_res["production_gap"],
                "achievement_pct": simulated_forecast_res["achievement_pct"],
                "risk_level": simulated_risk_res["risk_level"],
                "shortfall_prob_pct": simulated_risk_res["shortfall_probability_pct"],
                "expected_shortfall": simulated_risk_res["expected_shortfall_tons"]
            },
            "delta": {
                "recovered_production_tons": recovered_tons,
                "risk_reduced": baseline_risk_res["risk_level"] != simulated_risk_res["risk_level"],
                "prob_delta_pct": round(simulated_risk_res["shortfall_probability_pct"] - baseline_risk_res["shortfall_probability_pct"], 1)
            }
        }
