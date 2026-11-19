"""
ManganeseAI - Explainable AI (XAI) Engine
Calculates exact SHAP (SHapley Additive exPlanations) values for trained models,
generates waterfall data, natural language explanation sentences, global feature importances,
and zone-to-zone prediction contrast ("What Changed the Prediction?").
"""

import os
import joblib
import numpy as np
import pandas as pd
import shap

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")

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
    "rainfall_mm": "Rainfall (mm)",
    "soil_moisture_pct": "Soil Moisture (%)",
    "ndvi": "NDVI Vegetation",
    "land_surface_temp_c": "Land Temp (°C)"
}


class ExplainableAIEngine:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.explainer = None
        self.load_artifacts()

    def load_artifacts(self):
        model_path = os.path.join(MODELS_DIR, "reserve_model.pkl")
        scaler_path = os.path.join(MODELS_DIR, "reserve_scaler.pkl")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)

    def _get_explainer(self, X_background):
        if self.explainer is None and self.model is not None:
            self.explainer = shap.Explainer(self.model, X_background)
        return self.explainer

    def explain_zone(self, df_zones, target_zone_dict):
        """
        Computes SHAP values, waterfall chart breakdown, top positive/negative forces,
        and natural language sentence for the target zone.
        """
        if self.model is None or self.scaler is None:
            self.load_artifacts()

        # Prepare feature matrix
        X_df = df_zones[FEATURE_COLS].copy()
        X_scaled = self.scaler.transform(X_df)

        explainer = self._get_explainer(X_scaled)
        
        # Single zone feature array
        target_df = pd.DataFrame([{col: float(target_zone_dict.get(col, 0.0)) for col in FEATURE_COLS}])[FEATURE_COLS]
        target_scaled = self.scaler.transform(target_df)

        # Calculate SHAP values
        shap_res = explainer(target_scaled)
        
        # Determine predicted class index (0=Low, 1=Med, 2=High)
        probs = self.model.predict_proba(target_scaled)[0]
        pred_class_idx = int(np.argmax(probs))
        
        # Handle multi-class SHAP dimensions
        if len(shap_res.values.shape) == 3:
            # (batch, features, classes)
            shap_vals = shap_res.values[0, :, pred_class_idx]
            base_val = float(shap_res.base_values[0, pred_class_idx]) if hasattr(shap_res.base_values, '__len__') and len(shap_res.base_values.shape) > 1 else float(shap_res.base_values[0])
        else:
            shap_vals = shap_res.values[0]
            base_val = float(shap_res.base_values[0])

        # Map features to SHAP values & original input values
        waterfall_data = []
        positive_factors = []
        negative_factors = []

        running_val = base_val
        for i, col in enumerate(FEATURE_COLS):
            label = FEATURE_LABELS.get(col, col)
            val = float(target_df.iloc[0][col])
            s_val = round(float(shap_vals[i]), 4)
            running_val += s_val

            item = {
                "feature": col,
                "label": label,
                "value": val,
                "shap_value": s_val,
                "impact": "POSITIVE" if s_val >= 0 else "NEGATIVE",
                "running_value": round(float(running_val), 4)
            }
            waterfall_data.append(item)

            if s_val > 0:
                positive_factors.append((label, s_val, val))
            else:
                negative_factors.append((label, s_val, val))

        # Sort factors by magnitude
        positive_factors.sort(key=lambda x: x[1], reverse=True)
        negative_factors.sort(key=lambda x: abs(x[1]), reverse=True)

        # Global feature importance across all zones
        all_shap = explainer(X_scaled)
        if len(all_shap.values.shape) == 3:
            global_imp_raw = np.mean(np.abs(all_shap.values[:, :, pred_class_idx]), axis=0)
        else:
            global_imp_raw = np.mean(np.abs(all_shap.values), axis=0)
        
        sum_g = np.sum(global_imp_raw) if np.sum(global_imp_raw) > 0 else 1.0
        global_importance = [
            {
                "feature": col,
                "label": FEATURE_LABELS.get(col, col),
                "importance_pct": round(float((global_imp_raw[i] / sum_g) * 100.0), 2)
            }
            for i, col in enumerate(FEATURE_COLS)
        ]
        global_importance.sort(key=lambda x: x["importance_pct"], reverse=True)

        # Build Natural Language Explanation
        zone_id = target_zone_dict.get("zone_id", "Z01")
        pred_class_str = ["LOW", "MEDIUM", "HIGH"][pred_class_idx]
        
        pos_str = ", ".join([f"{f[0]} ({f[2]})" for f in positive_factors[:2]]) if positive_factors else "geological stability"
        neg_str = ", ".join([f"{f[0]} ({f[2]})" for f in negative_factors[:2]]) if negative_factors else "operational friction"

        natural_language = (
            f"Zone {zone_id} received a {pred_class_str} reserve potential rating primarily driven by strong positive contributions from "
            f"{pos_str}. However, {neg_str} slightly reduced the overall potential score."
        )

        return {
            "zone_id": zone_id,
            "predicted_class": pred_class_str,
            "confidence_pct": round(float(probs[pred_class_idx]) * 100.0, 1),
            "base_value": round(base_val, 4),
            "final_value": round(running_val, 4),
            "waterfall": waterfall_data,
            "positive_factors": [{"label": f[0], "shap": f[1], "value": f[2]} for f in positive_factors],
            "negative_factors": [{"label": f[0], "shap": f[1], "value": f[2]} for f in negative_factors],
            "global_importance": global_importance,
            "natural_language": natural_language
        }

    def compare_zones(self, zone_a_dict, zone_b_dict, df_zones):
        """
        Contrasts Zone A vs Zone B feature-by-feature ("What Changed the Prediction?").
        """
        exp_a = self.explain_zone(df_zones, zone_a_dict)
        exp_b = self.explain_zone(df_zones, zone_b_dict)

        comparisons = []
        for col in FEATURE_COLS:
            lbl = FEATURE_LABELS.get(col, col)
            val_a = float(zone_a_dict.get(col, 0.0))
            val_b = float(zone_b_dict.get(col, 0.0))
            delta_val = round(val_b - val_a, 2)

            item_a = next((x for x in exp_a["waterfall"] if x["feature"] == col), {"shap_value": 0.0})
            item_b = next((x for x in exp_b["waterfall"] if x["feature"] == col), {"shap_value": 0.0})

            shap_a = item_a["shap_value"]
            shap_b = item_b["shap_value"]
            delta_shap = round(shap_b - shap_a, 4)

            comparisons.append({
                "feature": col,
                "label": lbl,
                "zone_a_val": val_a,
                "zone_b_val": val_b,
                "delta_val": delta_val,
                "zone_a_shap": shap_a,
                "zone_b_shap": shap_b,
                "delta_shap": delta_shap,
                "impact_driver": "ZONE B STRONGER" if delta_shap > 0 else "ZONE A STRONGER" if delta_shap < 0 else "NEUTRAL"
            })

        comparisons.sort(key=lambda x: abs(x["delta_shap"]), reverse=True)

        zone_a_id = zone_a_dict.get("zone_id", "Zone A")
        zone_b_id = zone_b_dict.get("zone_id", "Zone B")

        top_driver = comparisons[0] if comparisons else None
        summary_sentence = f"The prediction difference between {zone_a_id} ({exp_a['predicted_class']}) and {zone_b_id} ({exp_b['predicted_class']}) is mainly caused by {top_driver['label']} (diff: {top_driver['delta_val']})."

        return {
            "zone_a": {"id": zone_a_id, "class": exp_a["predicted_class"], "confidence": exp_a["confidence_pct"]},
            "zone_b": {"id": zone_b_id, "class": exp_b["predicted_class"], "confidence": exp_b["confidence_pct"]},
            "contrast_summary": summary_sentence,
            "feature_comparisons": comparisons
        }
