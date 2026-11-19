"""
ManganeseAI - End-to-End ML Pipeline Orchestrator
Executes data preprocessing, feature engineering, model training, evaluation, cross-validation,
and artifact saving across all Engines.
"""

import os
import sys
import pandas as pd

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_generator import generate_reserve_dataset, generate_production_dataset, generate_data_dictionary, DATA_DIR
from src.reserve_engine import ReservePotentialEngine
from src.production_engine import ProductionForecastEngine
from src.shortfall_engine import ShortfallRiskEngine
from src.equipment_engine import EquipmentFailureEngine, generate_equipment_dataset

class ManganeseAIPipeline:
    def __init__(self):
        self.reserve_engine = ReservePotentialEngine()
        self.prod_engine = ProductionForecastEngine()
        self.shortfall_engine = ShortfallRiskEngine()
        self.equipment_engine = EquipmentFailureEngine()

    def run_full_pipeline(self):
        """Runs dataset generation, trains all models, saves metrics & artifacts."""
        print("=== STAGE 1: Generating Datasets ===")
        df_zones = generate_reserve_dataset(50)
        df_prod = generate_production_dataset(400)
        df_equipment = generate_equipment_dataset(50)
        generate_data_dictionary()

        print("\n=== STAGE 2: Training Module 1 (Smart Reserve Potential Engine) ===")
        reserve_metrics = self.reserve_engine.train_and_evaluate(df_zones)

        print("\n=== STAGE 3: Training Module 2 (Production Forecast Engine) ===")
        prod_metrics = self.prod_engine.train_and_evaluate(df_prod)

        print("\n=== STAGE 4: Training Module 3 (Intelligent Shortfall Risk Engine) ===")
        shortfall_metrics = self.shortfall_engine.train_and_evaluate(df_prod)

        print("\n=== STAGE 5: Training Module 4 (Equipment Failure Detection Engine) ===")
        equipment_metrics = self.equipment_engine.train_and_evaluate(df_equipment)

        print("\n=== PIPELINE EXECUTION COMPLETE ===")
        return {
            "reserve_metrics": reserve_metrics,
            "production_metrics": prod_metrics,
            "shortfall_metrics": shortfall_metrics,
            "equipment_metrics": equipment_metrics
        }

    def load_all_engines(self):
        """Loads pre-trained engines from disk."""
        df_zones = pd.read_csv(os.path.join(DATA_DIR, "zones.csv"))
        df_prod = pd.read_csv(os.path.join(DATA_DIR, "production_data.csv"))
        df_equipment = pd.read_csv(os.path.join(DATA_DIR, "equipment_fleet_data.csv"))
        
        self.reserve_engine.load_model()
        self.prod_engine.load_model()
        self.shortfall_engine.load_model()
        self.equipment_engine.load_model()
        
        return df_zones, df_prod, df_equipment

if __name__ == "__main__":
    pipeline = ManganeseAIPipeline()
    pipeline.run_full_pipeline()
