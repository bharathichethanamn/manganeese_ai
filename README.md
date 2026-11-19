# ManganeseAI
### Explainable Mining Intelligence for Manganese Reserve & Production Prediction

> **Problem Statement:** Using AI/ML and Space Technology to Identify Manganese Reserves and Overcome Production Shortfalls.
> **Dataset Tag:** `Demo/Synthetic Data – Replace with validated mining data.`

---

## 🌟 Executive Summary & Architecture

ManganeseAI is a full-stack, production-ready AI/ML intelligence platform designed for manganese mining operations. It connects satellite/environmental surface indicators, borehole drilling data, and geological rock properties with time-series operational telemetry to provide:

1. **Smart Reserve Potential Estimation** (Module 1)
2. **Production Forecast & Target Gap Analysis** (Module 2)
3. **Intelligent Production Shortfall Risk Detection** (Module 3)
4. **Mining Decision Intelligence Dashboard & What-If Simulator** (Module 4)

```
DATA (Geological + Drilling + Satellite + Telemetry)
 ↓
PREPROCESSING & TIME-SERIES SCALING
 ↓
FEATURE ENGINEERING & LAG CREATION
 ↓
ML PIPELINE (Logistic Regression, Random Forest, XGBoost)
 ↓
RESERVE POTENTIAL (0-100 Score & Interactive Map)
 ↓
PRODUCTION FORECAST (Tonnage & Target Gap)
 ↓
SHORTFALL RISK (Probability % & Risk Factor Attribution)
 ↓
DECISION SUPPORT & WHAT-IF SIMULATOR
```

---

## 🔬 Core Scientific & Technical Constraints

> ⚠️ **Scientific Constraint Enforced:** Satellite imagery alone DOES NOT directly detect underground manganese ore bodies.
> Satellite indicators (NDVI, Land Surface Temperature, Soil Moisture) provide surface environmental baselines and structural context, while ground-truth drilling depths, lithology host rock scores, and geological grade determine subsurface ore seam potential.

---

## 🚀 4 Core Modules

### 1. Smart Reserve Potential Engine (`src/reserve_engine.py`)
* **Features:** Geological Mn grade %, Lithology host score, Fault proximity (km), Ore thickness (m), Borehole drill depth (m), Mineralization density, Rainfall (mm), Soil moisture (%), NDVI, Land surface temp (°C).
* **Models Trained:** Logistic Regression, Random Forest Classifier, XGBoost Classifier.
* **Outputs:** 
  * Potential Class: `LOW POTENTIAL`, `MEDIUM POTENTIAL`, `HIGH POTENTIAL`
  * Potential Score: `0–100` model-derived score
  * Confidence % and model feature importance attribution per zone.
* **Visualization:** Interactive Folium map with color-coded markers (Green: High, Yellow: Medium, Red: Low).

### 2. Production Forecast & Target Gap Engine (`src/production_engine.py`)
* **Constraint Enforced:** Strict **Time-Based Train/Test Split** (chronological 80/20 split without random shuffling).
* **Features:** Lags, 7-day rolling historical production, Equipment availability %, Downtime hrs, Maintenance hrs, Rainfall, Soil moisture, Temperature, Blasting delay hrs, Production target.
* **Models Trained:** Linear Regression, Random Forest Regressor, XGBoost Regressor.
* **Outputs:** Predicted Production (Tons), Production Gap (Target - Forecast), Target Achievement Rate (%).

### 3. Intelligent Production Shortfall Risk Engine (`src/shortfall_engine.py`)
* **Objective:** Predict likelihood of production falling below targets and explain WHY.
* **Models Trained:** Logistic Regression, Random Forest, XGBoost with class balance handling (`class_weight='balanced'`).
* **Evaluation Focus:** High-Risk Recall, F1-Score, Confusion Matrix.
* **Explainability Innovation:** Dynamic risk factor attribution breaking down exact contribution % (e.g. Equipment Downtime 38%, Rainfall 24%, Blasting Delay 21%, Equipment Availability 17%).

### 4. Mining Decision Intelligence Dashboard & What-If Simulator (`app.py` & `src/simulator.py`)
* **Top KPI Cards:** Dynamic live metrics.
* **AI Decision-Support Panel:** Dynamic operational recommendations based on detected risk conditions.
* **What-If Production Simulator:** Interactive sliders allowing mine managers to change operational variables (Equipment Downtime, Availability, Blasting Delay, Rainfall) and run live predictions through trained ML models to see before/after forecasts and recovered tonnage (+X tons).

---

## 📂 Project Structure

```
manganese-ai/
├── data/
│   ├── geological_data.csv
│   ├── drilling_data.csv
│   ├── production_data.csv
│   ├── equipment_data.csv
│   ├── weather_data.csv
│   ├── satellite_data.csv
│   ├── zones.csv
│   └── data_dictionary.md
├── models/
│   ├── reserve_model.pkl
│   ├── reserve_scaler.pkl
│   ├── reserve_metrics.json
│   ├── production_model.pkl
│   ├── production_scaler.pkl
│   ├── production_metrics.json
│   ├── shortfall_model.pkl
│   ├── shortfall_scaler.pkl
│   └── shortfall_metrics.json
├── src/
│   ├── __init__.py
│   ├── data_generator.py
│   ├── reserve_engine.py
│   ├── production_engine.py
│   ├── shortfall_engine.py
│   ├── simulator.py
│   └── pipeline.py
├── app.py
├── requirements.txt
└── README.md
```

---

## ⚡ How to Run the Project

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run End-to-End ML Training Pipeline
```bash
python src/pipeline.py
```

### 3. Launch Streamlit Dashboard App
```bash
streamlit run app.py
```

---

## 🎯 Review Demonstration Flow (Step-by-Step)

Follow this exact sequence for your review presentation:

1. **Step 1: Open ManganeseAI Dashboard (`streamlit run app.py`)**
   * Point out Top KPI Cards (Total Mining Zones, High Potential Zones, 7-Day Production Avg, Forecast Production, Production Gap, Shortfall Risk).
2. **Step 2: Reserve Intelligence Module**
   * Demonstrate the **Interactive Reserve Map** centered on the Nagpur-Bhandara Manganese Belt.
   * Select **Zone Z05** from the dropdown. Show Potential Score (e.g., `84/100`), Class (`HIGH POTENTIAL`), Confidence %, and top feature importances (Geological Grade, Ore Seam Thickness).
3. **Step 3: Production Forecast Module**
   * Show the **Actual vs AI Forecast vs Target Production** time-series line chart.
   * Explain the time-based train/test split methodology and highlight the model comparison table.
4. **Step 4: Shortfall Risk Engine**
   * Point to the Large Risk Card (`SHORTFALL RISK: HIGH 🔴`, Probability `98%`, Expected Shortfall `90 Tons`).
   * Explain **"WHY is the risk HIGH?"** using the dynamic model-derived risk factor attribution progress bars.
5. **Step 5: What-If Production Simulator (Main Innovation)**
   * Move to the What-If Simulator section.
   * Adjust **Equipment Downtime** slider down from `8.0 hrs` to `2.0 hrs` or **Equipment Availability** up to `95%`.
   * Point to the live ML prediction update showing **Recovered Production (+X Tons)** and risk level reduction.
