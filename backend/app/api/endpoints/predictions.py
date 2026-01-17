from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Any
import asyncio

from app.api.models import PredictionRequest, PredictionResponse
from app.ml.data_processor import DataProcessor
from app.ml.models import model_manager

router = APIRouter()

@router.post("/", response_model=PredictionResponse)
async def make_prediction(request: PredictionRequest):
    """
    Make enhanced predictions using trained ML models
    """
    try:
        # Get historical data
        historical_data = DataProcessor.get_historical_series(
            request.building_id, 
            request.data_type,
            hours=min(request.hours_ahead * 3, 168)  # Get 3x prediction horizon, max 1 week
        )
        
        if not historical_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No historical data found for {request.building_id} - {request.data_type}"
            )
        
        # Get the appropriate predictor
        predictor = model_manager.get_predictor(request.data_type)
        
        # Check if model is trained
        if not predictor.is_trained:
            # Train on the fly with available data
            print(f"Training {request.data_type} predictor on the fly...")
            try:
                predictor.train(historical_data[:500])  # Use first 500 points
            except Exception as e:
                print(f"On-the-fly training failed: {e}")
                # Use fallback
                predictor.create_fallback_model()
        
        # Make predictions
        predictions_values = predictor.predict(historical_data[-24:])  # Use last 24 hours
        
        # Limit to requested horizon
        predictions_values = predictions_values[:request.hours_ahead]
        
        # Create prediction schedule
        predictions = DataProcessor.create_prediction_schedule(predictions_values)
        
        # Detect anomalies if requested
        anomalies = None
        if request.include_anomaly:
            try:
                if model_manager.anomaly_detector.is_trained:
                    anomaly_results = model_manager.anomaly_detector.detect(historical_data[-72:])  # Last 72 hours
                    
                    if anomaly_results:
                        anomalies = []
                        for anomaly in anomaly_results:
                            anomaly_time = datetime.utcnow() - timedelta(hours=len(historical_data[-72:]) - anomaly['index'])
                            anomalies.append({
                                'timestamp': anomaly_time.isoformat(),
                                'value': anomaly['value'],
                                'type': anomaly['type'],
                                'severity': min(100, anomaly['z_score'] * 20),
                                'confidence': anomaly['probability'],
                                'description': f"{anomaly['type'].capitalize()} anomaly detected (z-score: {anomaly['z_score']:.1f})"
                            })
            except Exception as e:
                print(f"Anomaly detection failed: {e}")
        
        # Calculate overall confidence based on data quality and model performance
        data_quality = min(1.0, len(historical_data) / 100)
        confidence = 0.7 * data_quality + 0.3 * (1.0 - (request.hours_ahead / 100))
        
        return PredictionResponse(
            building_id=request.building_id,
            data_type=request.data_type,
            predictions=predictions,
            confidence=round(confidence, 3),
            anomalies=anomalies
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/train-model")
async def train_ml_model(
    background_tasks: BackgroundTasks,
    data_type: str = "all",
    building_ids: List[str] = None,
    hours: int = 720
):
    """
    Train ML models with historical data
    """
    async def train_model_task():
        """Background task for model training"""
        try:
            print(f"Starting ML model training for {data_type}...")
            
            # Prepare training data
            training_data = DataProcessor.prepare_training_data(building_ids, hours)
            
            if data_type == "all" or data_type == "predictors":
                # Train predictors
                model_manager.train_all_models(training_data)
            
            if data_type == "all" or data_type == "anomaly":
                # Train anomaly detector
                if training_data.get('energy'):
                    # Generate training data for anomaly detector
                    normal_series = [item['series'] for item in training_data['energy'][:10]]
                    
                    if normal_series:
                        model_manager.anomaly_detector.train(normal_series)
                        model_manager.anomaly_detector.save('models/anomaly_detector.pkl')
                        print("Anomaly detector trained and saved")
            
            print("ML model training completed!")
            
        except Exception as e:
            print(f"Error in training task: {e}")
    
    # Start training in background
    background_tasks.add_task(train_model_task)
    
    return {
        "message": f"Started ML model training for {data_type}",
        "building_ids": building_ids or "all buildings",
        "hours_of_data": hours,
        "start_time": datetime.utcnow().isoformat(),
        "estimated_duration": "2-5 minutes"
    }

@router.get("/model-status")
async def get_model_status():
    """Get status of all ML models"""
    models_status = {
        'energy_predictor': {
            'is_trained': model_manager.energy_predictor.is_trained,
            'type': 'LSTM/RandomForest',
            'sequence_length': model_manager.energy_predictor.sequence_length,
            'prediction_horizon': model_manager.energy_predictor.prediction_horizon
        },
        'water_predictor': {
            'is_trained': model_manager.water_predictor.is_trained,
            'type': 'LSTM/RandomForest',
            'sequence_length': model_manager.water_predictor.sequence_length,
            'prediction_horizon': model_manager.water_predictor.prediction_horizon
        },
        'occupancy_predictor': {
            'is_trained': model_manager.occupancy_predictor.is_trained,
            'type': 'LSTM/RandomForest',
            'sequence_length': model_manager.occupancy_predictor.sequence_length,
            'prediction_horizon': model_manager.occupancy_predictor.prediction_horizon
        },
        'anomaly_detector': {
            'is_trained': model_manager.anomaly_detector.is_trained,
            'type': 'RandomForest',
            'features': model_manager.anomaly_detector.feature_names,
            'contamination': model_manager.anomaly_detector.contamination
        }
    }
    
    return {
        "models": models_status,
        "last_updated": datetime.utcnow().isoformat(),
        "models_directory": model_manager.models_dir
    }

@router.post("/what-if")
async def what_if_analysis(
    building_id: str,
    scenario: str,
    parameters: Dict[str, Any]
):
    """
    Run what-if analysis for sustainability scenarios
    """
    try:
        # Get current consumption
        current_energy = DataProcessor.get_historical_series(building_id, "energy", 24)
        avg_energy = np.mean(current_energy) if current_energy else 100
        
        # Initialize results
        results = {
            "building_id": building_id,
            "scenario": scenario,
            "parameters": parameters,
            "current_consumption": round(float(avg_energy), 2),
            "projected_consumption": round(float(avg_energy), 2),
            "savings_percentage": 0.0,
            "co2_reduction_kg": 0.0,
            "cost_savings": 0.0,
            "payback_period_years": None
        }
        
        # Calculate based on scenario
        if scenario == "solar_panels":
            # Solar panel simulation
            panel_area = parameters.get("panel_area", 200)
            efficiency = parameters.get("efficiency", 0.18)
            solar_hours = parameters.get("solar_hours", 5)
            
            # Calculate energy generation (kWh/day)
            solar_generation = panel_area * efficiency * solar_hours * 0.75  # 75% system efficiency
            
            # Calculate savings
            savings_percentage = min(70, (solar_generation / avg_energy) * 100) if avg_energy > 0 else 0
            results["savings_percentage"] = round(savings_percentage, 2)
            results["projected_consumption"] = round(avg_energy * (1 - savings_percentage/100), 2)
            
            # CO2 reduction (0.233 kg CO2 per kWh)
            results["co2_reduction_kg"] = round(solar_generation * 0.233 * 365, 2)
            
            # Cost savings ($0.12 per kWh)
            results["cost_savings"] = round(solar_generation * 0.12 * 365, 2)
            
            # Payback period (assuming $200 per m² installation cost)
            installation_cost = panel_area * 200
            results["payback_period_years"] = round(installation_cost / results["cost_savings"], 1) if results["cost_savings"] > 0 else None
        
        elif scenario == "led_lights":
            # LED lighting upgrade
            replacement_rate = parameters.get("replacement_rate", 100) / 100
            wattage_reduction = parameters.get("wattage_reduction", 70) / 100
            
            # Lighting typically accounts for 30% of building energy
            lighting_energy = avg_energy * 0.3
            savings = lighting_energy * replacement_rate * wattage_reduction
            
            results["savings_percentage"] = round((savings / avg_energy) * 100, 2)
            results["projected_consumption"] = round(avg_energy - savings, 2)
            results["co2_reduction_kg"] = round(savings * 0.233 * 365, 2)
            results["cost_savings"] = round(savings * 0.12 * 365, 2)
            
            # Payback period (assuming $10 per LED bulb, 100 bulbs in building)
            installation_cost = 100 * 10 * replacement_rate
            results["payback_period_years"] = round(installation_cost / results["cost_savings"], 1) if results["cost_savings"] > 0 else None
        
        elif scenario == "water_recycling":
            # Water recycling system
            recycling_rate = parameters.get("recycling_rate", 50) / 100
            
            # Get current water usage
            current_water = DataProcessor.get_historical_series(building_id, "water", 24)
            avg_water = np.mean(current_water) if current_water else 300
            
            water_savings = avg_water * recycling_rate * 0.8  # 80% efficiency
            
            results["current_water_usage"] = round(avg_water, 2)
            results["projected_water_usage"] = round(avg_water - water_savings, 2)
            results["water_savings_percentage"] = round((water_savings / avg_water) * 100, 2)
            
            # Cost savings ($0.005 per liter)
            results["cost_savings"] = round(water_savings * 0.005 * 365, 2)
            
            # Payback period (assuming $5000 system cost)
            results["payback_period_years"] = round(5000 / results["cost_savings"], 1) if results["cost_savings"] > 0 else None
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-if analysis error: {str(e)}")

@router.get("/predict-trend")
async def predict_trend(
    building_id: str,
    data_type: str = "energy",
    days: int = 30
):
    """
    Predict long-term trend for a building
    """
    try:
        # Get historical data
        historical_data = DataProcessor.get_historical_series(
            building_id, data_type, hours=days*24
        )
        
        if len(historical_data) < 7:  # Need at least 7 days of data
            return {
                "building_id": building_id,
                "data_type": data_type,
                "trend": "insufficient_data",
                "message": "Not enough historical data for trend analysis"
            }
        
        # Calculate trend using linear regression
        x = np.arange(len(historical_data))
        y = np.array(historical_data)
        
        # Remove NaN values
        mask = ~np.isnan(y)
        x_clean = x[mask]
        y_clean = y[mask]
        
        if len(x_clean) < 2:
            return {
                "building_id": building_id,
                "data_type": data_type,
                "trend": "insufficient_data",
                "message": "Not enough valid data points"
            }
        
        # Fit linear regression
        slope, intercept = np.polyfit(x_clean, y_clean, 1)
        
        # Determine trend
        if slope > 0.1:
            trend = "increasing"
            severity = "high" if slope > 0.5 else "moderate"
        elif slope < -0.1:
            trend = "decreasing"
            severity = "high" if slope < -0.5 else "moderate"
        else:
            trend = "stable"
            severity = "low"
        
        # Calculate predictions for next 7 days
        future_days = 7
        future_x = np.arange(len(historical_data), len(historical_data) + future_days)
        future_y = slope * future_x + intercept
        
        # Create prediction data
        predictions = []
        for i in range(future_days):
            predictions.append({
                "day": i + 1,
                "value": round(float(future_y[i]), 2),
                "change_percentage": round((future_y[i] - y_clean[-1]) / y_clean[-1] * 100, 2) if y_clean[-1] > 0 else 0
            })
        
        return {
            "building_id": building_id,
            "data_type": data_type,
            "historical_points": len(historical_data),
            "current_value": round(float(y_clean[-1]), 2) if len(y_clean) > 0 else 0,
            "trend": trend,
            "severity": severity,
            "slope": round(float(slope), 4),
            "r_squared": round(float(np.corrcoef(x_clean, y_clean)[0, 1]**2), 4) if len(x_clean) > 1 else 0,
            "predictions": predictions,
            "recommendation": get_recommendation(trend, severity, data_type)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend prediction error: {str(e)}")

def get_recommendation(trend: str, severity: str, data_type: str) -> str:
    """Get recommendation based on trend analysis"""
    recommendations = {
        "energy": {
            "increasing": {
                "high": "Immediate action required: Conduct energy audit and implement conservation measures",
                "moderate": "Monitor closely: Consider upgrading to energy-efficient equipment",
                "low": "Normal seasonal variation observed"
            },
            "decreasing": {
                "high": "Excellent: Continue current conservation practices",
                "moderate": "Good progress: Consider additional optimization opportunities",
                "low": "Stable performance"
            },
            "stable": "Maintain current operations and monitoring"
        },
        "water": {
            "increasing": {
                "high": "Check for leaks and review water usage patterns",
                "moderate": "Implement water-saving fixtures and practices",
                "low": "Normal usage pattern"
            },
            "decreasing": "Good water conservation practices in place",
            "stable": "Water usage is consistent"
        }
    }
    
    data_recs = recommendations.get(data_type, {})
    if trend in data_recs:
        if isinstance(data_recs[trend], dict):
            return data_recs[trend].get(severity, "Continue monitoring")
        return data_recs[trend]
    
    return "Continue monitoring and analysis"