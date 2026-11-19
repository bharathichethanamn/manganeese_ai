"""
ManganeseAI - Module 2: Production Forecast & Target Gap Engine
Predicts future manganese production (tons) and calculates production gap against operational targets.

Constraint:
Production data is time-dependent. MUST use a time-based train/test split without random shuffling.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

PROD_FEATURE_COLS = [
    "historical_production",
    "previous_production",
    "equipment_availability",
    "equipment_downtime",
    "maintenance_hours",
    "rainfall",
    "soil_moisture",
    "temperature",
    "blasting_delay",
    "production_target"
]


class ProductionForecastEngine:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.best_model_name = ""
        self.metrics = {}

    def train_and_evaluate(self, df_prod):
        """
        Trains Linear Regression, Random Forest, and XGBoost regressors using TIME-BASED split.
        Saves model artifacts and performance comparison metrics.
        """
        # Ensure chronological sorting
        df_sorted = df_prod.sort_values("date").reset_index(drop=True)
        
        X = df_sorted[PROD_FEATURE_COLS].copy()
        y = df_sorted["actual_production"].values

        # TIME-BASED TRAIN/TEST SPLIT (80% Train, 20% Test)
        split_idx = int(len(df_sorted) * 0.80)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        models = {
            "Linear Regression": LinearRegression(),
            "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42),
            "XGBoost Regressor": XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42)
        }

        results = {}
        best_r2 = -999.0
        best_model_obj = None
        best_name = ""

        for name, reg in models.items():
            reg.fit(X_train_scaled, y_train)
            y_pred = reg.predict(X_test_scaled)

            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)

            results[name] = {
                "mae": round(float(mae), 2),
                "rmse": round(float(rmse), 2),
                "r2_score": round(float(r2), 4)
            }

            if r2 > best_r2:
                best_r2 = r2
                best_model_obj = reg
                best_name = name

        self.model = best_model_obj
        self.best_model_name = best_name
        self.metrics = {
            "best_model": best_name,
            "all_models": results,
            "train_samples": split_idx,
            "test_samples": len(df_sorted) - split_idx
        }

        # Save model artifacts
        joblib.dump(self.model, os.path.join(MODELS_DIR, "production_model.pkl"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "production_scaler.pkl"))

        with open(os.path.join(MODELS_DIR, "production_metrics.json"), "w") as f:
            json.dump(self.metrics, f, indent=2)

        print(f"Production Engine trained successfully. Best Model: {best_name} (R2: {best_r2:.4f})")
        return self.metrics

    def load_model(self):
        """Loads saved production model artifacts."""
        model_path = os.path.join(MODELS_DIR, "production_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, "production_scaler.pkl")
        metrics_path = os.path.join(MODELS_DIR, "production_metrics.json")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    self.metrics = json.load(f)
            return True
        return False

    def forecast(self, input_dict):
        """
        Forecasts production tonnage, target gap, and achievement % for given feature inputs.
        """
        if self.model is None:
            if not self.load_model():
                raise RuntimeError("Production Forecast model is not trained yet.")

        input_data = {col: float(input_dict.get(col, 0.0)) for col in PROD_FEATURE_COLS}
        input_df = pd.DataFrame([input_data])[PROD_FEATURE_COLS]
        scaled_input = self.scaler.transform(input_df)

        pred_production = float(self.model.predict(scaled_input)[0])
        pred_production = max(0.0, round(pred_production, 1))

        target_prod = float(input_dict.get("production_target", 350.0))
        production_gap = round(target_prod - pred_production, 1)
        achievement_pct = round((pred_production / target_prod * 100.0), 1) if target_prod > 0 else 100.0

        return {
            "predicted_production": pred_production,
            "target_production": target_prod,
            "production_gap": production_gap,
            "achievement_pct": achievement_pct,
            "gap_status": "SHORTFALL" if production_gap > 0 else "SURPLUS"
        }


if __name__ == "__main__":
    from data_generator import DATA_DIR
    df_prod = pd.read_csv(os.path.join(DATA_DIR, "production_data.csv"))
    engine = ProductionForecastEngine()
    engine.train_and_evaluate(df_prod)

    sample_input = df_prod.iloc[-1].to_dict()
    res = engine.forecast(sample_input)
    print("Sample Forecast Output:", res)
