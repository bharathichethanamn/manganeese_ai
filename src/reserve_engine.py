"""
ManganeseAI - Module 1: Smart Reserve Potential Engine
Combines geological, drilling, and satellite/environmental indicators to estimate Manganese Reserve Potential.

Scientific Constraint:
Do NOT claim satellite imagery alone directly detects underground manganese.
Satellite data (NDVI, LST, Soil Moisture) provides surface/environmental context while
geological grade, ore thickness, and borehole drill depths provide subsurface ground truth.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    "geol_grade_pct",
    "lithology_score",
    "fault_proximity_km",
    "ore_thickness_m",
    "drill_depth_m",
    "mineralization_density",
    "rainfall_mm",
    "soil_moisture_pct",
    "ndvi",
    "land_surface_temp_c"
]

FEATURE_LABELS = {
    "geol_grade_pct": "Geological Grade (%)",
    "lithology_score": "Lithology Score",
    "fault_proximity_km": "Fault Proximity (km)",
    "ore_thickness_m": "Ore Seam Thickness (m)",
    "drill_depth_m": "Borehole Drill Depth (m)",
    "mineralization_density": "Mineralization Density",
    "rainfall_mm": "Annual Rainfall (mm)",
    "soil_moisture_pct": "Soil Moisture (%)",
    "ndvi": "NDVI Surface Vegetation",
    "land_surface_temp_c": "Land Surface Temp (°C)"
}

CLASS_MAP = {0: "LOW POTENTIAL", 1: "MEDIUM POTENTIAL", 2: "HIGH POTENTIAL"}
CLASS_INV_MAP = {"LOW POTENTIAL": 0, "MEDIUM POTENTIAL": 1, "HIGH POTENTIAL": 2}


class ReservePotentialEngine:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.best_model_name = ""
        self.metrics = {}
        self.feature_importances_ = {}

    def train_and_evaluate(self, df_zones):
        """
        Trains Logistic Regression, Random Forest, and XGBoost classifiers.
        Evaluates cross-validation metrics, selects best model, and saves artifacts.
        """
        X = df_zones[FEATURE_COLS].copy()
        y_labels = df_zones["potential_class"]
        y = y_labels.map(CLASS_INV_MAP).values

        # Stratified Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Define candidate models
        models = {
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
            "XGBoost": XGBClassifier(n_estimators=100, max_depth=4, eval_metric="mlogloss", random_state=42)
        }

        results = {}
        best_f1 = -1.0
        best_model_obj = None
        best_name = ""

        skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)

        for name, clf in models.items():
            # Cross-validation
            try:
                cv_scores = cross_val_score(clf, X_train_scaled, y_train, cv=skf, scoring="f1_macro")
                cv_f1_mean = round(float(cv_scores.mean()), 4)
            except Exception:
                cv_f1_mean = 0.0
            
            # Fit model
            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)

            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average="macro", zero_division=0)
            rec = recall_score(y_test, y_pred, average="macro", zero_division=0)
            f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
            cm = confusion_matrix(y_test, y_pred).tolist()

            results[name] = {
                "accuracy": round(float(acc), 4),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "f1_score": round(float(f1), 4),
                "cv_f1_mean": cv_f1_mean,
                "confusion_matrix": cm
            }

            if f1 > best_f1:
                best_f1 = f1
                best_model_obj = clf
                best_name = name

        self.model = best_model_obj
        self.best_model_name = best_name
        self.metrics = {
            "best_model": best_name,
            "all_models": results
        }

        # Calculate Feature Importances
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
        elif hasattr(self.model, "coef_"):
            importances = np.mean(np.abs(self.model.coef_), axis=0)
        else:
            importances = np.ones(len(FEATURE_COLS)) / len(FEATURE_COLS)

        # Normalize importances to sum to 100%
        sum_imp = np.sum(importances) if np.sum(importances) > 0 else 1.0
        norm_imp = (importances / sum_imp) * 100.0
        
        self.feature_importances_ = {
            FEATURE_LABELS[col]: round(float(norm_imp[i]), 2)
            for i, col in enumerate(FEATURE_COLS)
        }
        
        # Save artifacts
        joblib.dump(self.model, os.path.join(MODELS_DIR, "reserve_model.pkl"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "reserve_scaler.pkl"))
        
        with open(os.path.join(MODELS_DIR, "reserve_metrics.json"), "w") as f:
            json.dump({
                "metrics": self.metrics,
                "feature_importances": self.feature_importances_
            }, f, indent=2)

        print(f"Reserve Engine trained successfully. Best Model: {best_name} (F1: {best_f1:.4f})")
        return self.metrics

    def load_model(self):
        """Loads saved model artifacts."""
        model_path = os.path.join(MODELS_DIR, "reserve_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, "reserve_scaler.pkl")
        metrics_path = os.path.join(MODELS_DIR, "reserve_metrics.json")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    data = json.load(f)
                    self.metrics = data.get("metrics", {})
                    self.feature_importances_ = data.get("feature_importances", {})
            return True
        return False

    def predict_zone(self, zone_data_dict):
        """
        Predicts potential class, score (0-100), confidence %, and top feature importances for a single zone.
        """
        if self.model is None:
            if not self.load_model():
                raise RuntimeError("Reserve Potential model is not trained yet.")

        input_data = {col: float(zone_data_dict.get(col, 0.0)) for col in FEATURE_COLS}
        input_df = pd.DataFrame([input_data])[FEATURE_COLS]
        scaled_input = self.scaler.transform(input_df)

        probs = self.model.predict_proba(scaled_input)[0]  # Probabilities for LOW, MEDIUM, HIGH
        pred_class_idx = np.argmax(probs)
        pred_class = CLASS_MAP[pred_class_idx]
        confidence = round(float(probs[pred_class_idx]) * 100, 1)

        # Model-derived weighted Potential Score (0 - 100)
        # Class 0 (Low) = 0-33, Class 1 (Med) = 34-66, Class 2 (High) = 67-100
        score_val = (probs[0] * 20.0) + (probs[1] * 55.0) + (probs[2] * 90.0)
        potential_score = round(float(score_val), 1)

        # Sort feature importances for this prediction
        sorted_features = sorted(
            self.feature_importances_.items(), key=lambda x: x[1], reverse=True
        )

        return {
            "potential_class": pred_class,
            "potential_score": potential_score,
            "confidence_pct": confidence,
            "class_probabilities": {
                "LOW": round(float(probs[0]) * 100, 1),
                "MEDIUM": round(float(probs[1]) * 100, 1),
                "HIGH": round(float(probs[2]) * 100, 1)
            },
            "top_factors": sorted_features
        }


if __name__ == "__main__":
    from data_generator import DATA_DIR
    df_zones = pd.read_csv(os.path.join(DATA_DIR, "zones.csv"))
    engine = ReservePotentialEngine()
    engine.train_and_evaluate(df_zones)
    
    # Test sample prediction
    sample_zone = df_zones.iloc[0].to_dict()
    res = engine.predict_zone(sample_zone)
    print("Sample Zone Prediction:", res)
