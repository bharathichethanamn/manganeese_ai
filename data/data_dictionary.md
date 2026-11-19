# ManganeseAI - Data Dictionary

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

