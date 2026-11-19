"""
ManganeseAI - Synthetic Data Generator
Generates realistic mining datasets for Manganese Reserve Potential, Production Forecasting, and Shortfall Risk.
All generated datasets are clearly labeled as Demo/Synthetic Data.
"""

import os
import numpy as np
import pandas as pd

# Set fixed seed for reproducibility
np.random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)

DISCLAIMER_HEADER = "# Demo/Synthetic Data – Replace with validated mining data.\n"

def generate_reserve_dataset(n_zones=30):
    """
    Generates synthetic geological, drilling, and satellite/environmental indicator data for mining zones.
    Scientific Constraint: Combines geological + drilling + surface indicators (NDVI, LST, Moisture, Rainfall).
    """
    zone_ids = [f"Z{i+1:02d}" for i in range(n_zones)]
    
    # Coordinates centered around central Indian Manganese Belt (Nagpur-Bhandara-Balaghat region)
    base_lat, base_lon = 21.45, 79.75
    latitudes = base_lat + np.random.uniform(-0.3, 0.3, n_zones)
    longitudes = base_lon + np.random.uniform(-0.3, 0.3, n_zones)
    elevations = np.random.uniform(280, 480, n_zones)  # Meters
    
    # Geological features
    geol_grade_pct = np.random.uniform(18.0, 48.0, n_zones)       # Mn grade %
    lithology_score = np.random.uniform(2.0, 9.5, n_zones)        # 1-10 Gondite/Quartzite host score
    fault_proximity_km = np.random.uniform(0.2, 12.0, n_zones)   # Distance to fault km (closer often better)
    ore_thickness_m = np.random.uniform(3.0, 32.0, n_zones)      # Ore body thickness meters
    
    # Drilling features
    drill_depth = np.random.uniform(35.0, 220.0, n_zones)        # Drilling depth meters
    mineralization_density = np.random.uniform(1.2, 4.8, n_zones)# Core mineralization density
    
    # Satellite & Environmental features
    rainfall = np.random.uniform(850, 1550, n_zones)             # Annual rainfall mm
    soil_moisture = np.random.uniform(12.0, 42.0, n_zones)       # Soil moisture %
    ndvi = np.random.uniform(0.18, 0.72, n_zones)                # NDVI vegetation index
    land_surface_temp = np.random.uniform(24.0, 41.0, n_zones)  # LST in Celsius
    
    # Physical score calculation (0 to 100)
    score_raw = (
        0.30 * (geol_grade_pct / 48.0 * 100) +
        0.20 * (ore_thickness_m / 32.0 * 100) +
        0.15 * (mineralization_density / 4.8 * 100) +
        0.15 * (lithology_score / 9.5 * 100) +
        0.10 * (100 - (fault_proximity_km / 12.0 * 100)) +
        0.05 * (soil_moisture / 42.0 * 100) +
        0.05 * (ndvi / 0.72 * 100) +
        np.random.normal(0, 3, n_zones)
    )
    potential_score = np.clip(score_raw, 5, 98).round(1)
    
    # Categorize Potential Class
    potential_class = []
    for s in potential_score:
        if s < 45:
            potential_class.append("LOW POTENTIAL")
        elif s < 68:
            potential_class.append("MEDIUM POTENTIAL")
        else:
            potential_class.append("HIGH POTENTIAL")
            
    df_zones = pd.DataFrame({
        "zone_id": zone_ids,
        "latitude": np.round(latitudes, 4),
        "longitude": np.round(longitudes, 4),
        "elevation_m": np.round(elevations, 1),
        "geol_grade_pct": np.round(geol_grade_pct, 2),
        "lithology_score": np.round(lithology_score, 2),
        "fault_proximity_km": np.round(fault_proximity_km, 2),
        "ore_thickness_m": np.round(ore_thickness_m, 2),
        "drill_depth_m": np.round(drill_depth, 1),
        "mineralization_density": np.round(mineralization_density, 2),
        "rainfall_mm": np.round(rainfall, 1),
        "soil_moisture_pct": np.round(soil_moisture, 1),
        "ndvi": np.round(ndvi, 3),
        "land_surface_temp_c": np.round(land_surface_temp, 1),
        "potential_score": potential_score,
        "potential_class": potential_class,
        "data_source": "Demo/Synthetic Data – Replace with validated mining data."
    })
    
    # Save CSV files
    df_zones.to_csv(os.path.join(DATA_DIR, "zones.csv"), index=False)
    
    # Save modular component CSVs as requested
    df_zones[["zone_id", "geol_grade_pct", "lithology_score", "fault_proximity_km", "ore_thickness_m"]].to_csv(os.path.join(DATA_DIR, "geological_data.csv"), index=False)
    df_zones[["zone_id", "drill_depth_m", "mineralization_density"]].to_csv(os.path.join(DATA_DIR, "drilling_data.csv"), index=False)
    df_zones[["zone_id", "rainfall_mm", "soil_moisture_pct", "ndvi", "land_surface_temp_c"]].to_csv(os.path.join(DATA_DIR, "satellite_data.csv"), index=False)
    
    print(f"Generated reserve dataset with {n_zones} zones.")
    return df_zones


def generate_production_dataset(n_days=400):
    """
    Generates synthetic time-dependent daily mining production, equipment, and weather data.
    """
    dates = pd.date_range(start="2025-01-01", periods=n_days, freq="D")
    
    # Base daily production target (e.g., 350 tons/day ~ 10,500 tons/month)
    base_target = 350.0
    targets = base_target + np.random.normal(0, 15, n_days)
    
    # Features
    equipment_availability = np.random.beta(5, 1.5, n_days) * 100.0  # 50% - 100%
    equipment_downtime = (100.0 - equipment_availability) / 100.0 * 20.0 + np.random.uniform(0, 2, n_days)  # hrs
    maintenance_hours = np.random.uniform(0.5, 8.0, n_days)
    
    # Seasonality in rainfall (Monsoon spike)
    day_of_year = dates.dayofyear
    monsoon_factor = np.sin((day_of_year - 150) / 120 * np.pi)
    monsoon_factor = np.maximum(0, monsoon_factor)
    
    rainfall = np.random.exponential(scale=10.0, size=n_days) + monsoon_factor * 80.0
    soil_moisture = 15.0 + (rainfall / 150.0) * 30.0 + np.random.normal(0, 2, n_days)
    soil_moisture = np.clip(soil_moisture, 10.0, 50.0)
    
    temperature = 22.0 + 15.0 * np.sin((day_of_year - 80) / 365 * 2 * np.pi) + np.random.normal(0, 2, n_days)
    blasting_delay = np.random.choice([0, 1, 2, 4, 8], size=n_days, p=[0.4, 0.3, 0.15, 0.1, 0.05]) + (rainfall > 50).astype(int) * 3
    
    # Calculate synthetic actual production based on physical operational variables
    prod_raw = (
        targets + 40.0
        - (equipment_downtime * 8.5) 
        - (blasting_delay * 6.0) 
        - (rainfall * 0.35) 
        - ((100.0 - equipment_availability) * 1.0)
        + np.random.normal(0, 8, n_days)
    )
    actual_production = np.clip(prod_raw, 50.0, 420.0).round(1)
    
    # Derived historical features (Lags & Rolling averages)
    df_prod = pd.DataFrame({
        "date": dates,
        "production_target": np.round(targets, 1),
        "actual_production": actual_production,
        "equipment_availability": np.round(equipment_availability, 1),
        "equipment_downtime": np.round(equipment_downtime, 1),
        "maintenance_hours": np.round(maintenance_hours, 1),
        "rainfall": np.round(rainfall, 1),
        "soil_moisture": np.round(soil_moisture, 1),
        "temperature": np.round(temperature, 1),
        "blasting_delay": np.round(blasting_delay, 1),
        "data_source": "Demo/Synthetic Data – Replace with validated mining data."
    })
    
    # Add Lags
    df_prod["previous_production"] = df_prod["actual_production"].shift(1).bfill()
    df_prod["historical_production"] = df_prod["actual_production"].rolling(7, min_periods=1).mean().round(1)
    df_prod["production_trend"] = (df_prod["actual_production"] - df_prod["previous_production"]).round(1)
    
    # Calculate Shortfall Risk Label based on target gap
    gap = df_prod["production_target"] - df_prod["actual_production"]
    
    shortfall_risk = []
    for g in gap:
        if g <= 10:
            shortfall_risk.append("LOW")
        elif g <= 45:
            shortfall_risk.append("MEDIUM")
        else:
            shortfall_risk.append("HIGH")
            
    df_prod["shortfall_risk"] = shortfall_risk
    
    # Save CSV files
    df_prod.to_csv(os.path.join(DATA_DIR, "production_data.csv"), index=False)
    
    # Modular component CSVs
    df_prod[["date", "equipment_availability", "equipment_downtime", "maintenance_hours"]].to_csv(os.path.join(DATA_DIR, "equipment_data.csv"), index=False)
    df_prod[["date", "rainfall", "soil_moisture", "temperature"]].to_csv(os.path.join(DATA_DIR, "weather_data.csv"), index=False)
    
    print(f"Generated time-series production dataset with {n_days} days.")
    return df_prod

def generate_data_dictionary():
    """Generates a data dictionary markdown file."""
    dict_content = """# ManganeseAI - Data Dictionary

> **DISCLAIMER:** Demo/Synthetic Data – Replace with validated mining data.

---

## 1. Geological & Reserve Potential Features (`zones.csv`)

| Feature | Type | Unit | Description |
|---|---|---|---|
| `zone_id` | String | - | Unique identifier for mining zone (e.g. Z01) |
| `latitude` | Float | Deg | Latitude coordinate (Nagpur Manganese Belt) |
| `longitude` | Float | Deg | Longitude coordinate |
| `elevation_m` | Float | Meters | Elevation above sea level |
| `geol_grade_pct` | Float | % | Manganese ore grade percentage (18-48%) |
| `lithology_score` | Float | 1-10 | Host rock index (Gondite / braunite quartzite score) |
| `fault_proximity_km` | Float | km | Distance to regional fault/structural contact |
| `ore_thickness_m` | Float | Meters | Estimated thickness of manganese ore seam |
| `drill_depth_m` | Float | Meters | Maximum exploratory borehole depth |
| `mineralization_density` | Float | Index | Ore core density / mineralization intensity |
| `rainfall_mm` | Float | mm | Annual average precipitation |
| `soil_moisture_pct` | Float | % | Satellite-derived surface soil moisture percentage |
| `ndvi` | Float | -1 to 1 | Normalized Difference Vegetation Index (Surface indicator) |
| `land_surface_temp_c` | Float | °C | Thermal IR surface temperature |
| `potential_score` | Float | 0-100 | Target Reserve Potential Score |
| `potential_class` | String | Class | Target Class: LOW POTENTIAL, MEDIUM POTENTIAL, HIGH POTENTIAL |

---

## 2. Production & Shortfall Risk Features (`production_data.csv`)

| Feature | Type | Unit | Description |
|---|---|---|---|
| `date` | Date | YYYY-MM-DD | Daily record timestamp |
| `production_target` | Float | Tons | Planned target manganese production |
| `actual_production` | Float | Tons | Actual tonnage extracted |
| `equipment_availability` | Float | % | Heavy fleet operational availability |
| `equipment_downtime` | Float | Hours | Breakdown / unscheduled downtime hours |
| `maintenance_hours` | Float | Hours | Planned preventive maintenance hours |
| `rainfall` | Float | mm | Daily rainfall |
| `soil_moisture` | Float | % | Soil moisture level |
| `temperature` | Float | °C | Ambient site temperature |
| `blasting_delay` | Float | Hours | Mining sequence / blasting hold delay |
| `previous_production` | Float | Tons | Lag-1 daily production |
| `historical_production` | Float | Tons | 7-day rolling average production |
| `production_trend` | Float | Tons | Day-on-day production difference |
| `shortfall_risk` | String | Class | Shortfall Risk Level: LOW, MEDIUM, HIGH |

"""
    with open(os.path.join(DATA_DIR, "data_dictionary.md"), "w") as f:
        f.write(dict_content)
    print("Created data_dictionary.md")

if __name__ == "__main__":
    generate_reserve_dataset(50)
    generate_production_dataset(400)
    generate_data_dictionary()
