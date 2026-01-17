#!/usr/bin/env python3
"""
Script to train ML models with historical data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.models import model_manager
from app.ml.data_processor import DataProcessor
from app.db.influx_client import init_influxdb
import asyncio

async def main():
    print("Starting ML model training...")
    
    try:
        init_influxdb()
        # Prepare training data
        print("Collecting training data...")
        training_data = DataProcessor.prepare_training_data(hours=720)  # 30 days of data
        
        # Train all models
        print("Training models...")
        model_manager.train_all_models(training_data)
        
        print("\nTraining completed successfully!")
        model_manager.save_models()
        print(f"Models saved to: {model_manager.models_dir}")
        
        # Print model status
        print("\nModel Status:")
        print(f"Energy Predictor: {'Trained' if model_manager.energy_predictor.is_trained else 'Not trained'}")
        print(f"Water Predictor: {'Trained' if model_manager.water_predictor.is_trained else 'Not trained'}")
        print(f"Occupancy Predictor: {'Trained' if model_manager.occupancy_predictor.is_trained else 'Not trained'}")
        print(f"Anomaly Detector: {'Trained' if model_manager.anomaly_detector.is_trained else 'Not trained'}")
        
    except Exception as e:
        print(f"Error during training: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())