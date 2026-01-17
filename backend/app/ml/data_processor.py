import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.db.influx_client import query_sensor_data

class DataProcessor:
    """Processes and prepares data for ML models"""
    
    @staticmethod
    def get_historical_series(building_id: str, data_type: str, hours: int = 168) -> List[float]:
        """Get historical time series data for a building"""
        try:
            data = query_sensor_data(building_id, data_type, hours, limit=10000)
            
            if not data:
                return []
            
            # Convert to pandas for processing
            df = pd.DataFrame(data)
            df['time'] = pd.to_datetime(df['time'])
            df = df.sort_values('time')
            
            # Resample to hourly data if needed
            df.set_index('time', inplace=True)
            hourly_data = df['value'].resample('1H').mean()
            
            # Fill missing values
            hourly_data = hourly_data.interpolate(method='linear')
            
            return hourly_data.tolist()
            
        except Exception as e:
            print(f"Error getting historical series: {e}")
            return []
    
    @staticmethod
    def get_multiple_series(building_ids: List[str], data_type: str, hours: int = 168) -> Dict[str, List[float]]:
        """Get historical data for multiple buildings"""
        result = {}
        
        for building_id in building_ids:
            series = DataProcessor.get_historical_series(building_id, data_type, hours)
            if series:
                result[building_id] = series
        
        return result
    
    @staticmethod
    def prepare_training_data(building_ids: List[str] = None, hours: int = 720) -> Dict[str, Any]:
        """Prepare comprehensive training data"""
        if building_ids is None:
            building_ids = [f"building_{i}" for i in range(1, 11)]
        
        training_data = {
            'energy': [],
            'water': [],
            'occupancy': [],
            'metadata': {
                'building_ids': building_ids,
                'hours': hours,
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        for data_type in ['energy', 'water', 'occupancy']:
            series_dict = DataProcessor.get_multiple_series(building_ids, data_type, hours)
            
            for building_id, series in series_dict.items():
                if len(series) >= 24:  # Need at least 24 hours of data
                    training_data[data_type].append({
                        'building_id': building_id,
                        'series': series,
                        'length': len(series),
                        'mean': np.mean(series),
                        'std': np.std(series)
                    })
        
        # Add statistics
        for data_type in ['energy', 'water', 'occupancy']:
            if training_data[data_type]:
                training_data['metadata'][f'{data_type}_count'] = len(training_data[data_type])
                training_data['metadata'][f'{data_type}_total_points'] = sum(
                    [item['length'] for item in training_data[data_type]]
                )
        
        return training_data
    
    @staticmethod
    def generate_features(time_series: List[float]) -> Dict[str, float]:
        """Generate features from time series for anomaly detection"""
        if len(time_series) < 10:
            return {}
        
        ts_array = np.array(time_series)
        
        features = {
            'mean': float(np.mean(ts_array)),
            'std': float(np.std(ts_array)),
            'min': float(np.min(ts_array)),
            'max': float(np.max(ts_array)),
            'median': float(np.median(ts_array)),
            'q25': float(np.percentile(ts_array, 25)),
            'q75': float(np.percentile(ts_array, 75)),
            'skewness': float(pd.Series(ts_array).skew()),
            'kurtosis': float(pd.Series(ts_array).kurtosis()),
            'trend': float(np.polyfit(range(len(ts_array)), ts_array, 1)[0]),
            'autocorrelation_1': float(pd.Series(ts_array).autocorr(lag=1) if len(ts_array) > 1 else 0),
            'autocorrelation_24': float(pd.Series(ts_array).autocorr(lag=24) if len(ts_array) > 24 else 0),
        }
        
        # Add seasonal features if we have enough data
        if len(ts_array) >= 24:
            daily_pattern = []
            for i in range(24):
                indices = np.arange(i, len(ts_array), 24)
                if indices.size > 0:
                    daily_pattern.append(np.mean(ts_array[indices]))
            
            if daily_pattern:
                features['daily_amplitude'] = float(max(daily_pattern) - min(daily_pattern))
                features['daily_mean'] = float(np.mean(daily_pattern))
            else:
                features['daily_amplitude'] = 0.0
                features['daily_mean'] = 0.0
        
        return features
    
    @staticmethod
    def detect_seasonality(time_series: List[float]) -> Dict[str, Any]:
        """Detect seasonality patterns in time series"""
        if len(time_series) < 48:
            return {'has_seasonality': False, 'period': None, 'strength': 0.0}
        
        ts_array = np.array(time_series)
        
        # Try different periods
        best_period = None
        best_strength = 0
        
        for period in [24, 12, 6, 3]:  # Daily, half-daily, etc.
            if len(ts_array) >= period * 2:
                # Calculate autocorrelation at this period
                autocorr = pd.Series(ts_array).autocorr(lag=period)
                strength = abs(autocorr)
                
                if strength > best_strength:
                    best_strength = strength
                    best_period = period
        
        return {
            'has_seasonality': best_strength > 0.5,
            'period': best_period,
            'strength': float(best_strength)
        }
    
    @staticmethod
    def create_prediction_schedule(predictions: List[float], start_time: datetime = None) -> List[Dict[str, Any]]:
        """Create a schedule of predictions with timestamps"""
        if start_time is None:
            start_time = datetime.utcnow()
        
        schedule = []
        for i, value in enumerate(predictions):
            prediction_time = start_time + timedelta(hours=i+1)
            
            schedule.append({
                'hour_ahead': i + 1,
                'timestamp': prediction_time.isoformat(),
                'value': float(value),
                'confidence': max(0.7, 1.0 - (i * 0.02))  # Decreasing confidence with time
            })
        
        return schedule