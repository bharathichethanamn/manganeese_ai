"""
ManganeseAI - Module 3: Intelligent Production Shortfall Risk Engine
Predicts shortfall risk level (LOW, MEDIUM, HIGH) and calculates shortfall probability %.
Provides model-derived risk factor attribution explaining WHY risk is high/medium/low.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

SHORTFALL_FEATURE_COLS = [
    "equipment_downtime",
    "equipment_availability",
    "maintenance_hours",
    "rainfall",
    "blasting_delay",
    "historical_production",
    "production_trend",
    "temperature",
    "soil_moisture"
]

SHORTFALL_FEATURE_LABELS = {
    "equipment_downtime": "Equipment Downtime",
    "equipment_availability": "Equipment Availability",
    "maintenance_hours": "Maintenance Hours",
    "rainfall": "Rainfall Intensity",
    "blasting_delay": "Blasting Delay",
    "historical_production": "Historical Production Trend",
    "production_trend": "Day-on-Day Production Delta",
    "temperature": "Ambient Temperature",
    "soil_moisture": "Soil Moisture"
}

RISK_CLASS_MAP = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}
RISK_CLASS_INV_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


class ShortfallRiskEngine:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.best_model_name = ""
        self.metrics = {}
        self.global_feature_importances = {}
        self.feature_means = {}
        self.feature_stds = {}

    def train_and_evaluate(self, df_prod):
        """
        Trains Logistic Regression, Random Forest, and XGBoost classifiers with balanced class weights.
        Evaluates Precision, Recall (especially HIGH risk recall), F1-score, and Confusion Matrix.
        """
        X = df_prod[SHORTFALL_FEATURE_COLS].copy()
        y_labels = df_prod["shortfall_risk"]
        y = y_labels.map(RISK_CLASS_INV_MAP).values

        # Store baseline feature statistics for individual risk attribution calculation
        for col in SHORTFALL_FEATURE_COLS:
            self.feature_means[col] = float(X[col].mean())
            self.feature_stds[col] = float(X[col].std() if X[col].std() > 0 else 1.0)

        # Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        models = {
            "Logistic Regression": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
            "Random Forest Classifier": RandomForestClassifier(n_estimators=100, class_weight="balanced", max_depth=6, random_state=42),
            "XGBoost Classifier": XGBClassifier(n_estimators=100, max_depth=4, eval_metric="mlogloss", random_state=42)
        }

        results = {}
        best_high_recall = -1.0
        best_model_obj = None
        best_name = ""

        skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)

        for name, clf in models.items():
            try:
                cv_scores = cross_val_score(clf, X_train_scaled, y_train, cv=skf, scoring="recall_macro")
                cv_rec_mean = round(float(cv_scores.mean()), 4)
            except Exception:
                cv_rec_mean = 0.0

            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)

            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average="macro", zero_division=0)
            rec = recall_score(y_test, y_pred, average="macro", zero_division=0)
            f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
            
            # High Risk Recall (Class 2)
            high_mask = (y_test == 2)
            high_rec = float(recall_score(y_test[high_mask], y_pred[high_mask], average="micro", zero_division=0)) if np.sum(high_mask) > 0 else rec
            
            cm = confusion_matrix(y_test, y_pred).tolist()

            results[name] = {
                "accuracy": round(float(acc), 4),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "high_risk_recall": round(float(high_rec), 4),
                "f1_score": round(float(f1), 4),
                "cv_recall_mean": cv_rec_mean,
                "confusion_matrix": cm
            }

            # Prioritize High Risk Recall & F1
            combined_score = (high_rec * 0.6) + (f1 * 0.4)
            if combined_score > best_high_recall:
                best_high_recall = combined_score
                best_model_obj = clf
                best_name = name

        self.model = best_model_obj
        self.best_model_name = best_name
        self.metrics = {
            "best_model": best_name,
            "all_models": results
        }

        # Calculate Global Feature Importances
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
        elif hasattr(self.model, "coef_"):
            importances = np.mean(np.abs(self.model.coef_), axis=0)
        else:
            importances = np.ones(len(SHORTFALL_FEATURE_COLS)) / len(SHORTFALL_FEATURE_COLS)

        sum_imp = np.sum(importances) if np.sum(importances) > 0 else 1.0
        norm_imp = (importances / sum_imp) * 100.0

        self.global_feature_importances = {
            col: round(float(norm_imp[i]), 2)
            for i, col in enumerate(SHORTFALL_FEATURE_COLS)
        }

        # Save model artifacts
        joblib.dump(self.model, os.path.join(MODELS_DIR, "shortfall_model.pkl"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "shortfall_scaler.pkl"))

        with open(os.path.join(MODELS_DIR, "shortfall_metrics.json"), "w") as f:
            json.dump({
                "metrics": self.metrics,
                "global_feature_importances": self.global_feature_importances,
                "feature_means": self.feature_means,
                "feature_stds": self.feature_stds
            }, f, indent=2)

        print(f"Shortfall Risk Engine trained successfully. Best Model: {best_name}")
        return self.metrics

    def load_model(self):
        """Loads saved shortfall risk model artifacts."""
        model_path = os.path.join(MODELS_DIR, "shortfall_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, "shortfall_scaler.pkl")
        metrics_path = os.path.join(MODELS_DIR, "shortfall_metrics.json")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    data = json.load(f)
                    self.metrics = data.get("metrics", {})
                    self.global_feature_importances = data.get("global_feature_importances", {})
                    self.feature_means = data.get("feature_means", {})
                    self.feature_stds = data.get("feature_stds", {})
            return True
        return False

    def predict_risk(self, input_dict, target_prod=350.0, forecast_prod=None):
        """
        Predicts Shortfall Risk Level, Shortfall Probability %, Expected Shortfall (tons),
        and dynamically ranks top contributing risk factors based on model feature importances & deviations.
        """
        if self.model is None:
            if not self.load_model():
                raise RuntimeError("Shortfall Risk model is not trained yet.")

        input_data = {col: float(input_dict.get(col, 0.0)) for col in SHORTFALL_FEATURE_COLS}
        input_df = pd.DataFrame([input_data])[SHORTFALL_FEATURE_COLS]
        scaled_input = self.scaler.transform(input_df)

        probs = self.model.predict_proba(scaled_input)[0]  # LOW, MEDIUM, HIGH probabilities
        pred_idx = np.argmax(probs)
        risk_level = RISK_CLASS_MAP[pred_idx]

        # Shortfall Probability (Probability of MEDIUM or HIGH risk)
        shortfall_prob_pct = round(float(probs[1] * 50.0 + probs[2] * 100.0), 1)
        shortfall_prob_pct = min(100.0, max(0.0, shortfall_prob_pct))

        # Expected shortfall tons
        expected_shortfall = round(max(0.0, target_prod - forecast_prod), 1) if forecast_prod is not None else round(max(0.0, (shortfall_prob_pct / 100.0) * target_prod * 0.25), 1)

        # Dynamic Risk Factor Ranking for this instance
        # Combines global model feature importance with standard deviation score of input values
        factor_scores = {}
        for col in SHORTFALL_FEATURE_COLS:
            val = float(input_dict.get(col, 0.0))
            mean_val = self.feature_means.get(col, val)
            std_val = self.feature_stds.get(col, 1.0)
            
            # Risk direction (e.g. higher downtime = higher risk; lower availability = higher risk)
            z_score = (val - mean_val) / std_val if std_val > 0 else 0.0
            if col in ["equipment_availability", "historical_production"]:
                z_score = -z_score  # Invert so lower values increase risk score
            
            risk_impact = max(0.1, abs(z_score) + 0.5) * self.global_feature_importances.get(col, 10.0)
            factor_scores[SHORTFALL_FEATURE_LABELS[col]] = risk_impact

        # Normalize factor scores to 100%
        total_risk_score = sum(factor_scores.values()) if sum(factor_scores.values()) > 0 else 1.0
        ranked_factors = [
            (label, round((score / total_risk_score) * 100.0, 1))
            for label, score in sorted(factor_scores.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "risk_level": risk_level,
            "shortfall_probability_pct": shortfall_prob_pct,
            "expected_shortfall_tons": expected_shortfall,
            "probabilities": {
                "LOW": round(float(probs[0]) * 100.0, 1),
                "MEDIUM": round(float(probs[1]) * 100.0, 1),
                "HIGH": round(float(probs[2]) * 100.0, 1)
            },
            "top_risk_factors": ranked_factors[:4]  # Top 4 contributing factors
        }


if __name__ == "__main__":
    from data_generator import DATA_DIR
    df_prod = pd.read_csv(os.path.join(DATA_DIR, "production_data.csv"))
    engine = ShortfallRiskEngine()
    engine.train_and_evaluate(df_prod)

    sample_input = df_prod.iloc[-1].to_dict()
    res = engine.predict_risk(sample_input, target_prod=350.0, forecast_prod=260.0)
    print("Sample Shortfall Risk Output:", res)
