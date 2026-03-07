# train_ml.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, IsolationForest
import joblib
import os
from datetime import datetime
from influxdb_client import InfluxDBClient

# --- INFLUXDB CONFIGURATION ---
INFLUX_URL = os.getenv("INFLUX_URL", "http://influxdb:8086")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN", "my-super-secret-auth-token")
INFLUX_ORG = os.getenv("INFLUX_ORG", "campus_org")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "campus_data")

def fetch_influx_data():
    """Queries InfluxDB and returns a formatted Pandas DataFrame for ML Training"""
    print(f"[{datetime.now()}] Fetching historical data from InfluxDB...")
    
    client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
    query_api = client.query_api()

    flux_query = f'''
        from(bucket: "{INFLUX_BUCKET}")
          |> range(start: -30d)
          |> filter(fn: (r) => r["_measurement"] == "sensor_data")
          |> filter(fn: (r) => r.type == "energy" or r.type == "water" or r.type == "co2" or r.type == "occupancy")
          |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
          |> pivot(rowKey:["_time"], columnKey: ["type"], valueColumn: "_value")
    '''

    try:
        # Returns a Pandas DataFrame directly
        df = query_api.query_data_frame(flux_query)
        
        if df.empty:
            raise ValueError("InfluxDB returned an empty dataset. Check your query parameters.")

        # Clean up the DataFrame
        # InfluxDB adds metadata columns like result, table, _start, _stop. We drop them.
        cols_to_keep = ['_time', 'energy', 'co2', 'water', 'occupancy']
        # Only keep columns that actually exist in the returned data
        df = df[[c for c in cols_to_keep if c in df.columns]]
        
        # Ensure timestamp is datetime and handle missing values (forward fill)
        df['_time'] = pd.to_datetime(df['_time'])
        df = df.sort_values('_time').ffill().dropna()

        # FEATURE ENGINEERING: Extract time-based features for the Random Forest
        df['hour'] = df['_time'].dt.hour
        df['day_of_week'] = df['_time'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)

        client.close()
        print(f"[{datetime.now()}] Successfully loaded {len(df)} hourly records from InfluxDB.")
        return df

    except Exception as e:
        print(f"CRITICAL ERROR fetching from InfluxDB: {e}")
        client.close()
        return None

def run_training_pipeline():
    """Fetches real data, trains models, and saves them to disk."""
    print(f"\n[{datetime.now()}] --- STARTING AUTOMATED ML RETRAINING ---")
    
    # 1. Fetch Real Utility Data
    df_utilities = fetch_influx_data()
    
    if df_utilities is None or df_utilities.empty:
        print("Training aborted due to missing InfluxDB data.")
        return False

    # 2. Maintenance Data
    # (Note: If you also store vibration/motor temp in InfluxDB, write a second 
    # fetch_influx_data() query here. For now, we leave the synthetic generator 
    # to ensure the code runs if you don't have real HVAC vibration sensors yet).
    print("Generating Synthetic Predictive Maintenance Data...")
    maint_data = []
    for _ in range(5000):
        age_days = np.random.randint(10, 1000)
        vibration = np.random.uniform(0.5, 12.0)
        motor_temp = np.random.uniform(40, 90)
        
        status = 0
        if vibration > 8.0 or motor_temp > 75: status = 2
        elif vibration > 5.0 or motor_temp > 65 or age_days > 800: status = 1
            
        maint_data.append([age_days, vibration, motor_temp, status])
    df_maint = pd.DataFrame(maint_data, columns=['age_days', 'vibration_mm_s', 'motor_temp_c', 'status'])

    # 3. Train Models
    print("Training Forecasting & Anomaly Models...")
    
    # Define features and ensure they exist
    features = ['hour', 'day_of_week', 'temperature']
    X_forecast = df_utilities[features]
    
    models_forecast = {}
    models_anomaly = {}
    
    # Loop through targets, checking if they exist in your InfluxDB data
    for target in ['energy', 'water', 'occupancy']:
        if target in df_utilities.columns:
            print(f" -> Training {target}...")
            rf = RandomForestRegressor(n_estimators=100, random_state=42)
            rf.fit(X_forecast, df_utilities[target])
            models_forecast[target] = rf
            
            iso = IsolationForest(contamination=0.02, random_state=42)
            iso.fit(df_utilities[[target]])
            models_anomaly[target] = iso
        else:
            print(f" -> WARNING: {target} not found in InfluxDB data. Skipping model.")

    print("Training Maintenance Classifier...")
    X_maint = df_maint[['age_days', 'vibration_mm_s', 'motor_temp_c']]
    maint_model = RandomForestClassifier(n_estimators=100, random_state=42)
    maint_model.fit(X_maint, df_maint['status'])

    # 4. Save Models
    os.makedirs("models", exist_ok=True)
    
    for target, model in models_forecast.items():
        joblib.dump(model, f"models/{target.split('_')[0]}_predictor.pkl")
        
    for target, model in models_anomaly.items():
        joblib.dump(model, f"models/{target.split('_')[0]}_anomaly_model.pkl")

    joblib.dump(maint_model, "models/maintenance_classifier_model.pkl")

    print(f"[{datetime.now()}] --- RETRAINING COMPLETE ---")
    return True

# Allow manual execution from terminal
if __name__ == "__main__":
    run_training_pipeline()