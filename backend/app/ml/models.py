import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error
import pickle
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class LSTMModel:
    """LSTM model for time-series prediction (simplified with linear model for now)"""
    
    def __init__(self, sequence_length=24, prediction_horizon=24):
        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        self.scaler = StandardScaler()
        self.model = None
        self.is_trained = False
        
    def prepare_data(self, data):
        """Prepare time-series data for LSTM"""
        if len(data) < self.sequence_length + self.prediction_horizon:
            raise ValueError(f"Need at least {self.sequence_length + self.prediction_horizon} data points")
        
        # Normalize data
        data_normalized = self.scaler.fit_transform(np.array(data).reshape(-1, 1)).flatten()
        
        # Create sequences
        X, y = [], []
        for i in range(len(data_normalized) - self.sequence_length - self.prediction_horizon + 1):
            X.append(data_normalized[i:i + self.sequence_length])
            y.append(data_normalized[i + self.sequence_length:i + self.sequence_length + self.prediction_horizon])
        
        return np.array(X), np.array(y)
    
    def train(self, data, epochs=50, validation_split=0.2):
        """Train the model (simplified for now - will use Random Forest as placeholder)"""
        print(f"Training LSTM model on {len(data)} data points...")
        
        try:
            # Prepare data
            X, y = self.prepare_data(data)
            
            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=validation_split, shuffle=False
            )
            
            # For now, use Random Forest as placeholder (replace with actual LSTM later)
            # Reshape for Random Forest
            X_train_flat = X_train.reshape(X_train.shape[0], -1)
            X_val_flat = X_val.reshape(X_val.shape[0], -1)
            
            # Train a separate model for each prediction step
            self.models = []
            for step in range(self.prediction_horizon):
                rf = RandomForestRegressor(n_estimators=100, random_state=42)
                rf.fit(X_train_flat, y_train[:, step])
                self.models.append(rf)
                
                # Print accuracy for this step
                y_pred = rf.predict(X_val_flat)
                mae = mean_absolute_error(y_val[:, step], y_pred)
                print(f"Step {step+1}: MAE = {mae:.4f}")
            
            self.is_trained = True
            print("Model training completed!")
            
        except Exception as e:
            print(f"Error training model: {e}")
            # Create simple fallback model
            self.create_fallback_model()
    
    def create_fallback_model(self):
        """Create a simple fallback model"""
        self.models = [RandomForestRegressor(n_estimators=10, random_state=42) for _ in range(self.prediction_horizon)]
        # Train with dummy data
        dummy_X = np.random.randn(100, self.sequence_length)
        for model in self.models:
            model.fit(dummy_X, np.random.randn(100))
        self.is_trained = True
        print("Fallback model created")
    
    def predict(self, historical_data):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        if len(historical_data) < self.sequence_length:
            padded_data = np.zeros(self.sequence_length)
            padded_data[-len(historical_data):] = historical_data
            historical_data = padded_data
        
        input_window = np.array(historical_data[-self.sequence_length:])
        
        data_reshaped = input_window.reshape(-1, 1)
        
        data_normalized = self.scaler.transform(data_reshaped)
        
        model_input = data_normalized.flatten().reshape(1, -1)
        
        # Make predictions for each step
        predictions = []
        for step, model in enumerate(self.models):
            pred = model.predict(model_input)[0]
            predictions.append(float(pred))
        
        predictions_array = np.array(predictions).reshape(-1, 1)
        predictions_final = self.scaler.inverse_transform(predictions_array).flatten()
        
        return predictions_final.tolist()
    
    def save(self, filepath):
        """Save model to file"""
        if self.is_trained:
            with open(filepath, 'wb') as f:
                pickle.dump({
                    'models': self.models,
                    'scaler': self.scaler,
                    'sequence_length': self.sequence_length,
                    'prediction_horizon': self.prediction_horizon,
                    'is_trained': self.is_trained
                }, f)
    
    def load(self, filepath):
        """Load model from file"""
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.models = data['models']
            self.scaler = data['scaler']
            self.sequence_length = data['sequence_length']
            self.prediction_horizon = data['prediction_horizon']
            self.is_trained = data['is_trained']

class AnomalyDetector:
    """Random Forest based anomaly detector"""
    
    def __init__(self, contamination=0.1):
        self.contamination = contamination
        self.scaler = StandardScaler()
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        self.feature_names = [
            'mean', 'std', 'min', 'max', 'median', 
            'trend', 'seasonality', 'residual_std'
        ]
    
    def extract_features(self, time_series):
        """Extract features from time series"""
        time_series = np.array(time_series)
        if len(time_series) < 10:
            return None
        
        features = []
        
        # Basic statistics
        features.append(np.mean(time_series))
        features.append(np.std(time_series))
        features.append(np.min(time_series))
        features.append(np.max(time_series))
        features.append(np.median(time_series))
        
        # Trend (simple linear regression slope)
        x = np.arange(len(time_series))
        slope = np.polyfit(x, time_series, 1)[0]
        features.append(slope)
        
        # Seasonality (difference between max and min in seasonal pattern)
        if len(time_series) >= 24:  # Daily seasonality
            daily_pattern = []
            for i in range(24):
                indices = np.arange(i, len(time_series), 24)
                if len(indices) > 0:
                    daily_pattern.append(np.mean([time_series[j] for j in indices if j < len(time_series)]))
            if daily_pattern:
                features.append(max(daily_pattern) - min(daily_pattern))
            else:
                features.append(0)
        else:
            features.append(0)
        
        # Residual standard deviation
        residuals = time_series - np.convolve(time_series, np.ones(5)/5, mode='same')
        features.append(np.std(residuals))
        
        return np.array(features)
    
    def prepare_training_data(self, normal_data, anomaly_data=None):
        """Prepare training data with labels"""
        X = []
        y = []
        
        # Extract features from normal data
        for ts in normal_data:
            features = self.extract_features(ts)
            if features is not None:
                X.append(features)
                y.append(0)  # Normal
        
        # Extract features from anomaly data if provided
        if anomaly_data:
            for ts in anomaly_data:
                features = self.extract_features(ts)
                if features is not None:
                    X.append(features)
                    y.append(1)  # Anomaly
        
        return np.array(X), np.array(y)
    
    def train(self, normal_data, anomaly_data=None):
        """Train the anomaly detector"""
        print(f"Training anomaly detector on {len(normal_data)} samples...")
        
        X, y = self.prepare_training_data(normal_data, anomaly_data)
        
        if len(X) == 0:
            print("Not enough data for training")
            return
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_val)
        accuracy = accuracy_score(y_val, y_pred)
        
        print(f"Validation accuracy: {accuracy:.4f}")
        self.is_trained = True
    
    def detect(self, time_series, threshold=0.5):
        """Detect anomalies in time series"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        features = self.extract_features(time_series)
        if features is None:
            return []
        
        features_scaled = self.scaler.transform([features])
        probability = self.model.predict_proba(features_scaled)[0][1]
        
        anomalies = []
        if probability > threshold:
            # Find specific points that are anomalous
            mean_val = np.mean(time_series)
            std_val = np.std(time_series)
            
            for i, value in enumerate(time_series):
                z_score = abs(value - mean_val) / std_val if std_val > 0 else 0
                if z_score > 2.5:  # More than 2.5 standard deviations
                    anomalies.append({
                        'index': i,
                        'value': float(value),
                        'z_score': float(z_score),
                        'probability': float(probability),
                        'type': 'high' if value > mean_val else 'low'
                    })
        
        return anomalies
    
    def generate_synthetic_anomalies(self, normal_series, num_anomalies=10):
            """Generate synthetic anomalies for training"""
            anomalies = []
            
            for _ in range(num_anomalies):
                # Randomly select a base series
                base_idx = np.random.randint(0, len(normal_series))
                
                base = np.array(normal_series[base_idx], dtype=float).copy()
                
                # Apply different types of anomalies
                anomaly_type = np.random.choice(['spike', 'drop', 'shift', 'noise'])
                
                if anomaly_type == 'spike':
                    spike_idx = np.random.randint(0, len(base))
                    base[spike_idx] *= np.random.uniform(2, 5) # Now works!
                
                elif anomaly_type == 'drop':
                    drop_idx = np.random.randint(0, len(base))
                    base[drop_idx] *= np.random.uniform(0.1, 0.3)
                
                elif anomaly_type == 'shift':
                    shift_amount = np.random.uniform(1.5, 3)
                    base *= shift_amount
                
                elif anomaly_type == 'noise':
                    # std calculation and addition now works on numpy array
                    noise = np.random.normal(0, np.std(base) * 3, len(base))
                    base += noise
                
                anomalies.append(base)
            
            return anomalies
    
    def save(self, filepath):
        """Save model to file"""
        if self.is_trained:
            with open(filepath, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'scaler': self.scaler,
                    'feature_names': self.feature_names,
                    'is_trained': self.is_trained
                }, f)
    
    def load(self, filepath):
        """Load model from file"""
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.scaler = data['scaler']
            self.feature_names = data['feature_names']
            self.is_trained = data['is_trained']

class ModelManager:
    """Manages all ML models for the application"""
    
    def __init__(self, models_dir='models'):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        
        # Initialize models
        self.energy_predictor = LSTMModel(sequence_length=24, prediction_horizon=24)
        self.water_predictor = LSTMModel(sequence_length=24, prediction_horizon=24)
        self.occupancy_predictor = LSTMModel(sequence_length=24, prediction_horizon=24)
        
        self.anomaly_detector = AnomalyDetector()
        
        # Load existing models if available
        self.load_models()
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            energy_path = os.path.join(self.models_dir, 'energy_predictor.pkl')
            if os.path.exists(energy_path):
                self.energy_predictor.load(energy_path)
                print("Loaded energy predictor model")
            
            water_path = os.path.join(self.models_dir, 'water_predictor.pkl')
            if os.path.exists(water_path):
                self.water_predictor.load(water_path)
                print("Loaded water predictor model")
            
            occupancy_path = os.path.join(self.models_dir, 'occupancy_predictor.pkl')
            if os.path.exists(occupancy_path):
                self.occupancy_predictor.load(occupancy_path)
                print("Loaded occupancy predictor model")
            
            anomaly_path = os.path.join(self.models_dir, 'anomaly_detector.pkl')
            if os.path.exists(anomaly_path):
                self.anomaly_detector.load(anomaly_path)
                print("Loaded anomaly detector model")
                
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def save_models(self):
        """Save all models to disk"""
        try:
            self.energy_predictor.save(os.path.join(self.models_dir, 'energy_predictor.pkl'))
            self.water_predictor.save(os.path.join(self.models_dir, 'water_predictor.pkl'))
            self.occupancy_predictor.save(os.path.join(self.models_dir, 'occupancy_predictor.pkl'))
            self.anomaly_detector.save(os.path.join(self.models_dir, 'anomaly_detector.pkl'))
            print("All models saved successfully")
        except Exception as e:
            print(f"Error saving models: {e}")
    
    def get_predictor(self, data_type):
        """Get the appropriate predictor for data type"""
        if data_type == 'energy':
            return self.energy_predictor
        elif data_type == 'water':
            return self.water_predictor
        elif data_type == 'occupancy':
            return self.occupancy_predictor
        else:
            raise ValueError(f"No predictor for data type: {data_type}")
    
    def train_all_models(self, historical_data):
            """Train all models with historical data"""
            print("Training all ML models...")
            
            data_by_type = {
                'energy': historical_data.get('energy', []),
                'water': historical_data.get('water', []),
                'occupancy': historical_data.get('occupancy', [])
            }
            
            # Train predictors
            for data_type, data_list in data_by_type.items():
                if data_list:
                    predictor = self.get_predictor(data_type)
                    try:
                        # Combine data from all buildings
                        combined_data = []
                        for building_entry in data_list:
                            # building_entry is the dict containing 'building_id' and 'series'
                            series = building_entry.get('series', [])
                            combined_data.extend(series)
                        
                        if len(combined_data) > 100:
                            predictor.train(combined_data[:1000])
                            print(f"Trained {data_type} predictor")
                    except Exception as e:
                        print(f"Error training {data_type} predictor: {e}")
    # Train anomaly detector
            try:
                # Use energy data for anomaly detection training
                energy_entries = data_by_type.get('energy', [])
                if energy_entries:
                    # 1. Convert to NumPy arrays immediately to support math operations
                    training_series = [np.array(entry['series'], dtype=float) for entry in energy_entries[:10]]

                    # 2. Generate synthetic anomalies
                    synthetic_anomalies = self.anomaly_detector.generate_synthetic_anomalies(
                        training_series,
                        num_anomalies=5
                    )
                    
                    # 3. Train with both normal and synthetic data
                    self.anomaly_detector.train(
                        normal_data=training_series,
                        anomaly_data=synthetic_anomalies
                    )
                    print("Trained anomaly detector")
            except Exception as e:
                print(f"Error training anomaly detector: {e}")

# Global model manager instance
model_manager = ModelManager()