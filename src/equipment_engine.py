"""
ManganeseAI - Equipment Failure Detection & Prediction Engine
Predicts equipment failure probability, risk level (LOW, MEDIUM, HIGH), and failure status.
Provides feature attribution explaining top contributing failure factors and recommended preventive actions.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

EQUIPMENT_FEATURE_COLS = [
    "operating_hours",
    "historical_downtime_hrs",
    "equipment_availability_pct",
    "previous_breakdown_count",
    "maintenance_hours",
    "operating_temperature_c",
    "fuel_consumption_lph",
    "load_capacity_util_pct",
    "vibration_mm_s",
    "days_since_last_service"
]

EQUIPMENT_FEATURE_LABELS = {
    "operating_hours": "Operating Hours",
    "historical_downtime_hrs": "Historical Downtime",
    "equipment_availability_pct": "Equipment Availability",
    "previous_breakdown_count": "Previous Breakdown Count",
    "maintenance_hours": "Maintenance Hours",
    "operating_temperature_c": "Operating Temperature",
    "fuel_consumption_lph": "Fuel Consumption Rate",
    "load_capacity_util_pct": "Load Capacity Usage",
    "vibration_mm_s": "Vibration Severity Index",
    "days_since_last_service": "Days Since Last Service"
}

EQUIPMENT_TYPES = [
    ("Excavator", "EXC"),
    ("Drill Rig", "DRL"),
    ("Wheel Loader", "LD"),
    ("Haul Truck", "HT"),
    ("Conveyor Belt", "BLT")
]


def generate_equipment_dataset(n_zones=50):
    """
    Generates realistic historical operational data for mining equipment fleet across all zones (Z01..Z50).
    Every zone has 5 specialized pieces of machinery.
    """
    np.random.seed(42)
    records = []

    for z_idx in range(1, n_zones + 1):
        zone_id = f"Z{z_idx:02d}"
        
        for eq_name, eq_code in EQUIPMENT_TYPES:
            eq_id = f"{eq_code}-{z_idx:02d}"
            
            # Realistic synthetic distribution based on equipment type
            operating_hours = np.random.uniform(2500, 19500)
            previous_breakdowns = int(np.random.poisson(lam=operating_hours / 3500.0))
            historical_downtime = np.random.uniform(8.0, 160.0) + (previous_breakdowns * 6.5)
            availability = np.clip(100.0 - (historical_downtime / 2.5) + np.random.normal(0, 3), 35.0, 99.0)
            maintenance_hours = np.random.uniform(10.0, 110.0)
            operating_temp = np.random.uniform(62.0, 108.0)
            fuel_cons = np.random.uniform(22.0, 92.0)
            load_util = np.random.uniform(48.0, 112.0)
            vibration = np.random.uniform(1.1, 9.2)
            days_last_service = int(np.random.uniform(3, 95))
            
            # Physics-inspired risk score formula to compute ground-truth failure probability
            risk_raw = (
                0.22 * (operating_hours / 19500.0) +
                0.20 * (historical_downtime / 180.0) +
                0.18 * (1.0 - availability / 100.0) +
                0.15 * (previous_breakdowns / 12.0) +
                0.10 * ((operating_temp - 60) / 50.0) +
                0.08 * (vibration / 9.5) +
                0.07 * (days_last_service / 90.0)
            )
            
            prob = np.clip(risk_raw + np.random.normal(0, 0.04), 0.05, 0.95)
            failure_status = 1 if prob >= 0.55 else 0

            records.append({
                "equipment_id": eq_id,
                "zone_id": zone_id,
                "equipment_type": eq_name,
                "operating_hours": np.round(operating_hours, 1),
                "historical_downtime_hrs": np.round(historical_downtime, 1),
                "equipment_availability_pct": np.round(availability, 1),
                "previous_breakdown_count": previous_breakdowns,
                "maintenance_hours": np.round(maintenance_hours, 1),
                "operating_temperature_c": np.round(operating_temp, 1),
                "fuel_consumption_lph": np.round(fuel_cons, 1),
                "load_capacity_util_pct": np.round(load_util, 1),
                "vibration_mm_s": np.round(vibration, 2),
                "days_since_last_service": days_last_service,
                "failure_status": failure_status,
                "failure_probability_ground_truth": np.round(prob * 100, 1)
            })

    df_equipment = pd.DataFrame(records)
    csv_path = os.path.join(DATA_DIR, "equipment_fleet_data.csv")
    df_equipment.to_csv(csv_path, index=False)
    print(f"Generated equipment fleet dataset with {len(df_equipment)} equipment records across {n_zones} zones -> {csv_path}")
    return df_equipment


class EquipmentFailureEngine:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.best_model_name = ""
        self.metrics = {}
        self.feature_importances = {}
        self.model_file = os.path.join(MODELS_DIR, "equipment_failure_model.joblib")
        self.meta_file = os.path.join(MODELS_DIR, "equipment_failure_meta.json")

    def train_and_evaluate(self, df_equipment=None):
        """
        Trains and compares Random Forest, XGBoost, and Logistic Regression models.
        Selects the best-performing model based on F1-Score & ROC-AUC, and saves pipeline to disk.
        """
        if df_equipment is None:
            csv_path = os.path.join(DATA_DIR, "equipment_fleet_data.csv")
            if not os.path.exists(csv_path):
                df_equipment = generate_equipment_dataset(50)
            else:
                df_equipment = pd.read_csv(csv_path)

        X = df_equipment[EQUIPMENT_FEATURE_COLS]
        y = df_equipment["failure_status"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        candidate_models = {
            "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
            "XGBoost": XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, eval_metric="logloss", random_state=42),
            "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42)
        }

        best_f1 = -1.0
        best_model = None
        best_name = ""
        evaluation_results = {}

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

        for name, clf in candidate_models.items():
            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)
            y_proba = clf.predict_proba(X_test_scaled)[:, 1] if hasattr(clf, "predict_proba") else y_pred

            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            auc = float(roc_auc_score(y_test, y_proba))
            cv_scores = cross_val_score(clf, X_train_scaled, y_train, cv=cv, scoring="f1")

            evaluation_results[name] = {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(auc, 4),
                "cv_f1_mean": round(float(cv_scores.mean()), 4)
            }

            if f1 > best_f1:
                best_f1 = f1
                best_model = clf
                best_name = name

        self.model = best_model
        self.best_model_name = best_name
        self.metrics = evaluation_results[best_name]

        # Calculate feature importances
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
        elif hasattr(self.model, "coef_"):
            importances = np.abs(self.model.coef_[0])
        else:
            importances = np.ones(len(EQUIPMENT_FEATURE_COLS)) / len(EQUIPMENT_FEATURE_COLS)

        imp_dict = {}
        for col, imp in zip(EQUIPMENT_FEATURE_COLS, importances):
            imp_dict[col] = float(np.round(imp, 4))
        
        # Normalize importances
        tot = sum(imp_dict.values()) or 1.0
        self.feature_importances = {k: round(v / tot, 4) for k, v in imp_dict.items()}

        # Save model pipeline & meta info to disk
        artifact = {
            "model": self.model,
            "scaler": self.scaler,
            "best_name": self.best_model_name,
            "feature_cols": EQUIPMENT_FEATURE_COLS
        }
        joblib.dump(artifact, self.model_file)

        meta_info = {
            "best_model": self.best_model_name,
            "metrics": self.metrics,
            "candidate_evaluations": evaluation_results,
            "feature_importances": self.feature_importances
        }
        with open(self.meta_file, "w") as f:
            json.dump(meta_info, f, indent=2)

        print(f"Equipment Failure Engine trained successfully! Best Model: {self.best_model_name} (F1: {best_f1:.4f}, ROC-AUC: {evaluation_results[best_name]['roc_auc']:.4f})")
        return meta_info

    def load_model(self):
        """Loads pre-trained model and scaler from disk."""
        if not os.path.exists(self.model_file):
            print("Model file not found. Running dataset generation & training...")
            self.train_and_evaluate()
            return

        artifact = joblib.load(self.model_file)
        self.model = artifact["model"]
        self.scaler = artifact["scaler"]
        self.best_model_name = artifact.get("best_name", "RandomForest")

        if os.path.exists(self.meta_file):
            with open(self.meta_file, "r") as f:
                meta = json.load(f)
                self.metrics = meta.get("metrics", {})
                self.feature_importances = meta.get("feature_importances", {})

    def predict_equipment(self, equipment_row):
        """
        Performs ML inference for a single equipment dictionary/series.
        Returns failure_probability_pct, risk_level, predicted_status, contributing_factors, recommendation.
        """
        if self.model is None:
            self.load_model()

        # Build feature vector
        features = []
        for col in EQUIPMENT_FEATURE_COLS:
            val = float(equipment_row.get(col, 0.0))
            features.append(val)

        X_in = np.array([features])
        X_scaled = self.scaler.transform(X_in)

        prob_val = float(self.model.predict_proba(X_scaled)[0, 1]) if hasattr(self.model, "predict_proba") else 0.5
        prob_pct = round(prob_val * 100.0, 1)

        if prob_pct >= 70.0:
            risk_level = "HIGH"
            status = "HIGH_RISK_FAILURE"
        elif prob_pct >= 40.0:
            risk_level = "MEDIUM"
            status = "MODERATE_RISK"
        else:
            risk_level = "LOW"
            status = "OPERATIONAL"

        # Calculate instance-level contributing factors (SHAP proxy using feature weight * z-score)
        means = self.scaler.mean_
        stds = np.sqrt(self.scaler.var_) + 1e-6
        z_scores = (np.array(features) - means) / stds

        factor_scores = []
        for idx, col in enumerate(EQUIPMENT_FEATURE_COLS):
            imp = self.feature_importances.get(col, 0.1)
            # High downtime, temp, hours, vibration increase risk; high availability decreases risk
            if col == "equipment_availability_pct":
                impact = -1.0 * z_scores[idx] * imp
            else:
                impact = z_scores[idx] * imp

            factor_scores.append({
                "feature": col,
                "label": EQUIPMENT_FEATURE_LABELS.get(col, col),
                "value": float(equipment_row.get(col, 0.0)),
                "impact_score": round(float(impact), 3)
            })

        # Sort top 4 contributing factors
        sorted_factors = sorted(factor_scores, key=lambda x: x["impact_score"], reverse=True)[:4]

        # Generate preventive recommendation
        top_factor_label = sorted_factors[0]["label"] if sorted_factors else "Operating Hours"
        eq_id = equipment_row.get("equipment_id", "Equipment")
        eq_type = equipment_row.get("equipment_type", "Machine")

        if risk_level == "HIGH":
            recommendation = (
                f"Schedule immediate preventive maintenance for {eq_id} ({eq_type}). "
                f"Inspect hydraulic lines, cooling system, and bearing alignment prior to high-load mining operations. "
                f"Primary risk driver: {top_factor_label}."
            )
        elif risk_level == "MEDIUM":
            recommendation = (
                f"Monitor operational parameters for {eq_id} during upcoming shift. "
                f"Perform routine lubrication and check thermal thresholds. "
                f"Primary watch factor: {top_factor_label}."
            )
        else:
            recommendation = (
                f"Equipment {eq_id} is operating within healthy performance thresholds. "
                f"Maintain standard scheduled service intervals."
            )

        return {
            "equipment_id": equipment_row.get("equipment_id"),
            "zone_id": equipment_row.get("zone_id"),
            "equipment_type": equipment_row.get("equipment_type"),
            "failure_probability_pct": prob_pct,
            "risk_level": risk_level,
            "predicted_status": status,
            "operating_hours": float(equipment_row.get("operating_hours", 0)),
            "historical_downtime_hrs": float(equipment_row.get("historical_downtime_hrs", 0)),
            "equipment_availability_pct": float(equipment_row.get("equipment_availability_pct", 0)),
            "previous_breakdown_count": int(equipment_row.get("previous_breakdown_count", 0)),
            "maintenance_hours": float(equipment_row.get("maintenance_hours", 0)),
            "operating_temperature_c": float(equipment_row.get("operating_temperature_c", 0)),
            "fuel_consumption_lph": float(equipment_row.get("fuel_consumption_lph", 0)),
            "load_capacity_util_pct": float(equipment_row.get("load_capacity_util_pct", 0)),
            "vibration_mm_s": float(equipment_row.get("vibration_mm_s", 0)),
            "days_since_last_service": int(equipment_row.get("days_since_last_service", 0)),
            "contributing_factors": sorted_factors,
            "recommendation": recommendation
        }

    def get_zone_equipment_predictions(self, zone_id):
        """
        Retrieves all equipment for a zone and ranks them sorted HIGH-risk first.
        """
        csv_path = os.path.join(DATA_DIR, "equipment_fleet_data.csv")
        if not os.path.exists(csv_path):
            generate_equipment_dataset(50)

        df_fleet = pd.read_csv(csv_path)
        df_zone = df_fleet[df_fleet["zone_id"] == zone_id]

        if df_zone.empty:
            return {
                "zone_id": zone_id,
                "equipment_count": 0,
                "equipment": [],
                "error": "No equipment records found for the selected zone."
            }

        predictions = []
        for _, row in df_zone.iterrows():
            pred = self.predict_equipment(row.to_dict())
            
            # Synthetic 6-month historical downtime trend for chart rendering
            base_dt = pred["historical_downtime_hrs"] / 6.0
            dt_trend = [
                {"month": "Jul", "downtime": round(base_dt * 0.8, 1), "availability": round(min(99, pred["equipment_availability_pct"] + 4), 1)},
                {"month": "Aug", "downtime": round(base_dt * 0.9, 1), "availability": round(min(99, pred["equipment_availability_pct"] + 2), 1)},
                {"month": "Sep", "downtime": round(base_dt * 1.1, 1), "availability": round(max(30, pred["equipment_availability_pct"] - 1), 1)},
                {"month": "Oct", "downtime": round(base_dt * 1.0, 1), "availability": round(pred["equipment_availability_pct"], 1)},
                {"month": "Nov", "downtime": round(base_dt * 1.3, 1), "availability": round(max(30, pred["equipment_availability_pct"] - 3), 1)},
                {"month": "Dec", "downtime": round(base_dt * 1.5, 1), "availability": round(max(30, pred["equipment_availability_pct"] - 5), 1)}
            ]
            pred["historical_trend"] = dt_trend
            predictions.append(pred)

        # Sort HIGH risk equipment first!
        risk_rank_map = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        predictions.sort(key=lambda x: (risk_rank_map.get(x["risk_level"], 3), -x["failure_probability_pct"]))

        high_count = sum(1 for p in predictions if p["risk_level"] == "HIGH")
        med_count = sum(1 for p in predictions if p["risk_level"] == "MEDIUM")
        low_count = sum(1 for p in predictions if p["risk_level"] == "LOW")

        return {
            "zone_id": zone_id,
            "equipment_count": len(predictions),
            "high_risk_count": high_count,
            "medium_risk_count": med_count,
            "low_risk_count": low_count,
            "model_used": self.best_model_name,
            "model_metrics": self.metrics,
            "equipment": predictions
        }
