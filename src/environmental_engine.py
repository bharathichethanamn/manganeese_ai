"""
ManganeseAI - Module 1: Satellite & Weather Environmental Mining Intelligence Engine
Synthesizes satellite & surface environmental observations (Rainfall, Soil Moisture, NDVI, LST Temperature)
into Environmental Mining Health Scores, Weather Impact Predictions, Anomaly Detection, and Trend Analysis.
"""

import numpy as np
import pandas as pd


class EnvironmentalIntelligenceEngine:
    def __init__(self):
        # Baseline reference optimal ranges for open-cast manganese mining
        self.optimal_ranges = {
            "rainfall_mm": (600.0, 1400.0),       # Moderate rainfall avoids pit flooding & extreme dust
            "soil_moisture_pct": (15.0, 35.0),   # Low-to-moderate moisture allows heavy vehicle movement
            "ndvi": (0.25, 0.55),                 # Moderate vegetation cover
            "land_surface_temp_c": (20.0, 32.0)   # Safe thermal operating range for heavy diesel machinery
        }

    def calculate_health_score(self, zone_dict):
        """
        Calculates 0-100 AI-Derived Environmental Mining Condition Score and breakdown.
        Clearly labeled as an AI-derived operational condition index.
        """
        rain = float(zone_dict.get("rainfall_mm", 1200.0))
        moisture = float(zone_dict.get("soil_moisture_pct", 30.0))
        ndvi = float(zone_dict.get("ndvi", 0.40))
        temp = float(zone_dict.get("land_surface_temp_c", 28.0))

        # 1. Rainfall score (0-25)
        if 800.0 <= rain <= 1400.0:
            r_score = 25.0
            r_status = "OPTIMAL"
        elif rain < 800.0:
            r_score = max(10.0, 25.0 - (800.0 - rain) / 50.0)
            r_status = "DRY / DUSTY"
        else:
            r_score = max(5.0, 25.0 - (rain - 1400.0) / 30.0)
            r_status = "HEAVY RAIN / INUNDATION RISK"

        # 2. Soil Moisture score (0-25)
        if 15.0 <= moisture <= 35.0:
            m_score = 25.0
            m_status = "OPTIMAL STABILITY"
        elif moisture < 15.0:
            m_score = 20.0
            m_status = "LOOSE SOIL"
        else:
            m_score = max(5.0, 25.0 - (moisture - 35.0) * 1.2)
            m_status = "HIGH SATURATION / MUD SINK"

        # 3. NDVI score (0-25)
        if 0.25 <= ndvi <= 0.55:
            v_score = 25.0
            v_status = "NORMAL VEGETATION"
        elif ndvi < 0.25:
            v_score = 20.0
            v_status = "CLEAR SURFACE BENCH"
        else:
            v_score = max(10.0, 25.0 - (ndvi - 0.55) * 40.0)
            v_status = "DENSE OVERBURDEN"

        # 4. Temperature score (0-25)
        if 20.0 <= temp <= 32.0:
            t_score = 25.0
            t_status = "IDEAL THERMAL RANGE"
        elif temp < 20.0:
            t_score = 22.0
            t_status = "COLD OPERATING SHIFT"
        else:
            t_score = max(5.0, 25.0 - (temp - 32.0) * 2.0)
            t_status = "HIGH HEAT / ENGINE OVERHEAT RISK"

        total_score = round(r_score + m_score + v_score + t_score, 1)

        if total_score >= 85.0:
            status = "EXCELLENT"
            color = "#10B981"
        elif total_score >= 70.0:
            status = "GOOD"
            color = "#3B82F6"
        elif total_score >= 50.0:
            status = "MODERATE"
            color = "#F59E0B"
        else:
            status = "CRITICAL"
            color = "#EF4444"

        return {
            "environmental_score": total_score,
            "status": status,
            "status_color": color,
            "label": "AI-Derived Environmental Operating Condition Score",
            "breakdown": {
                "rainfall": {"score": round(r_score, 1), "value": rain, "status": r_status},
                "soil_moisture": {"score": round(m_score, 1), "value": moisture, "status": m_status},
                "ndvi": {"score": round(v_score, 1), "value": ndvi, "status": v_status},
                "temperature": {"score": round(t_score, 1), "value": temp, "status": t_status}
            }
        }

    def predict_weather_impact(self, zone_dict):
        """
        Estimates weather impact level (LOW, MEDIUM, HIGH IMPACT) on pit haulage & excavation.
        """
        rain = float(zone_dict.get("rainfall_mm", 1200.0))
        moisture = float(zone_dict.get("soil_moisture_pct", 30.0))
        temp = float(zone_dict.get("land_surface_temp_c", 28.0))

        if rain > 1500.0 or moisture > 45.0:
            impact_level = "HIGH IMPACT"
            reason = "Heavy precipitation causing bench water accumulation & high soil moisture saturation."
            effect = "Reduced haul truck traction, pit dewatering required, potential 15-25% haulage delay."
            main_factor = "Heavy Monsoon Rainfall & Pit Inundation"
            color = "#EF4444"
        elif rain > 1300.0 or moisture > 38.0 or temp > 35.0:
            impact_level = "MEDIUM IMPACT"
            reason = "Elevated soil moisture combined with ambient thermal stress."
            effect = "Minor haulage speed reduction, equipment cooling checks required."
            main_factor = "Soil Moisture / Thermal Range"
            color = "#F59E0B"
        else:
            impact_level = "LOW IMPACT"
            reason = "Favorable surface atmospheric & environmental conditions."
            effect = "Unimpeded mining excavation & haulage flow."
            main_factor = "Optimal Weather Parameters"
            color = "#10B981"

        return {
            "impact_level": impact_level,
            "reason": reason,
            "possible_effect": effect,
            "main_contributing_factor": main_factor,
            "color": color
        }

    def detect_anomalies(self, zone_dict, df_zones):
        """
        Detects environmental anomalies by comparing zone values against dataset mean & std.
        """
        anomalies = []
        
        metrics_to_check = [
            ("rainfall_mm", "Rainfall", "mm", 1.8),
            ("soil_moisture_pct", "Soil Moisture", "%", 1.8),
            ("land_surface_temp_c", "Land Surface Temp", "°C", 2.0),
            ("ndvi", "NDVI Vegetation", "", 2.0)
        ]

        for col, label, unit, z_thresh in metrics_to_check:
            val = float(zone_dict.get(col, 0.0))
            mean_val = float(df_zones[col].mean())
            std_val = float(df_zones[col].std()) if df_zones[col].std() > 0 else 1.0

            z_score = (val - mean_val) / std_val
            dev_pct = round(((val - mean_val) / mean_val) * 100.0, 1)

            if abs(z_score) >= z_thresh:
                severity = "SEVERE ANOMALY" if abs(z_score) >= 2.5 else "MODERATE ANOMALY"
                direction = "higher" if dev_pct > 0 else "lower"
                msg = f"{label} is {abs(dev_pct)}% {direction} than the regional zone average ({round(mean_val, 1)} {unit})."

                anomalies.append({
                    "metric": label,
                    "current_value": val,
                    "unit": unit,
                    "historical_average": round(mean_val, 1),
                    "deviation_pct": dev_pct,
                    "severity": severity,
                    "message": msg
                })

        return anomalies

    def compare_all_zones(self, df_zones, enrich_fn):
        """
        Compares & ranks all zones based on environmental score (Best -> Worst).
        """
        ranked = []
        for idx, row in df_zones.iterrows():
            z_dict = enrich_fn(row.to_dict(), idx)
            score_data = self.calculate_health_score(z_dict)
            impact_data = self.predict_weather_impact(z_dict)

            ranked.append({
                "zone_id": z_dict["zone_id"],
                "environmental_score": score_data["environmental_score"],
                "status": score_data["status"],
                "status_color": score_data["status_color"],
                "impact_level": impact_data["impact_level"],
                "rainfall_mm": z_dict["rainfall_mm"],
                "soil_moisture_pct": z_dict["soil_moisture_pct"],
                "ndvi": z_dict["ndvi"],
                "land_surface_temp_c": z_dict["land_surface_temp_c"]
            })

        ranked.sort(key=lambda x: x["environmental_score"], reverse=True)
        return ranked

    def get_trends(self, zone_dict):
        """
        Returns historical monthly environmental trend series.
        """
        rain_base = float(zone_dict.get("rainfall_mm", 1200.0))
        moist_base = float(zone_dict.get("soil_moisture_pct", 30.0))
        temp_base = float(zone_dict.get("land_surface_temp_c", 28.0))
        ndvi_base = float(zone_dict.get("ndvi", 0.40))

        months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]
        # Seasonal factors simulating monsoon curve
        rain_factors = [0.4, 0.8, 1.3, 1.2, 0.9, 0.5]
        moist_factors = [0.5, 0.7, 1.2, 1.1, 0.9, 0.6]
        temp_factors = [1.15, 1.05, 0.95, 0.92, 0.98, 1.02]

        series = []
        for idx, m in enumerate(months):
            series.append({
                "month": m,
                "rainfall": round(rain_base * rain_factors[idx], 1),
                "soil_moisture": round(moist_base * moist_factors[idx], 1),
                "temperature": round(temp_base * temp_factors[idx], 1),
                "ndvi": round(ndvi_base * (0.9 + idx * 0.03), 3)
            })
        return series
