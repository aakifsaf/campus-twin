from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any
from app.core.config import settings
import sys
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Global client instance
client = None
write_api = None
query_api = None

def init_influxdb():
    global client, write_api, query_api
    try:
        client = InfluxDBClient(
            url=settings.INFLUXDB_URL,
            token=settings.INFLUXDB_TOKEN,
            org=settings.INFLUXDB_ORG
        )

        write_api = client.write_api(write_options=SYNCHRONOUS)
        query_api = client.query_api()
        
        logger.info(f"✅ Connected to InfluxDB at {settings.INFLUXDB_URL}")
        create_initial_data()
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to InfluxDB: {e}")
        # In a script, you might want to exit. In a web server, you might just log it.
        raise 

def write_sensor_data(building_id: str, data_type: str, value: float, timestamp=None):
    # CRITICAL: Check if API exists before using it
    if not write_api:
        logger.error("Write API not initialized. Call init_influxdb() first.")
        return False

    if not timestamp:
        timestamp = datetime.utcnow()
    
    point = Point("sensor_data") \
        .tag("building", building_id) \
        .tag("type", data_type) \
        .field("value", float(value)) \
        .time(timestamp, WritePrecision.NS)
    
    try:
        write_api.write(bucket=settings.INFLUXDB_BUCKET, org=settings.INFLUXDB_ORG, record=point)
        return True
    except Exception as e:
        logger.error(f"Error writing to InfluxDB: {e}")
        return False

def query_sensor_data(building_id: str = None, data_type: str = None, hours: int = 24, limit: int = 1000):
    if not query_api:
        logger.error("Query API not initialized.")
        return []

    # Note the newlines \n to ensure the query segments don't merge incorrectly
    query = f'''
    from(bucket: "{settings.INFLUXDB_BUCKET}")
        |> range(start: -{hours}h)
        |> filter(fn: (r) => r._measurement == "sensor_data")
    '''
    
    if building_id:
        query += f'\n|> filter(fn: (r) => r.building == "{building_id}")'
    
    if data_type:
        query += f'\n|> filter(fn: (r) => r.type == "{data_type}")'
    
    query += f'\n|> limit(n: {limit})'
    
    try:
        # Pass the org here as well to be safe
        tables = query_api.query(query, org=settings.INFLUXDB_ORG)
        results = []
        
        for table in tables:
            for record in table.records:
                results.append({
                    "building": record.values.get("building"),
                    "type": record.values.get("type"),
                    "value": record.get_value(),
                    "time": record.get_time().isoformat()
                })
        return results
    except Exception as e:
        logger.error(f"Error querying InfluxDB: {e}")
        return []

def create_initial_data():
    """Create initial synthetic data for demonstration"""
    buildings = [f"building_{i}" for i in range(1, settings.CAMPUS_BUILDINGS + 1)]
    data_types = ["energy", "water", "occupancy", "temperature", "co2"]
    
    # Generate data for the last 7 days
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)
    
    current_time = start_time
    while current_time < end_time:
        for building in buildings:
            for data_type in data_types:
                # Generate realistic values based on data type (all as floats)
                if data_type == "energy":
                    value = random.uniform(50.0, 200.0)  # kWh
                elif data_type == "water":
                    value = random.uniform(100.0, 500.0)  # liters
                elif data_type == "occupancy":
                    value = float(random.randint(0, 200))  # people (as float)
                elif data_type == "temperature":
                    value = random.uniform(18.0, 25.0)  # degrees C
                elif data_type == "co2":
                    value = random.uniform(400.0, 800.0)  # ppm
                
                # Add daily pattern
                hour = current_time.hour
                if 8 <= hour <= 18:  # Daytime
                    value *= random.uniform(1.2, 2.0)
                else:  # Nighttime
                    value *= random.uniform(0.3, 0.8)
                
                # Write data point
                write_sensor_data(building, data_type, value, current_time)
        
        # Move to next time interval (15 minutes)
        current_time += timedelta(minutes=15)
    
    logger.info("Initial data created successfully")

def get_building_stats():
    """Get statistics for all buildings including water, co2, and occupancy"""
    buildings = [f"building_{i}" for i in range(1, settings.CAMPUS_BUILDINGS + 1)]
    stats = {}
    
    for building in buildings:
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
            |> range(start: -24h)
            |> filter(fn: (r) => r._measurement == "sensor_data")
            |> filter(fn: (r) => r.building == "{building}")
            |> filter(fn: (r) => r.type == "energy" or r.type == "water" or r.type == "co2" or r.type == "occupancy")
            |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
        '''
        
        try:
            tables = query_api.query(query)
            # Defaults in case data is missing
            building_data = {
                "energy": 0,
                "water_usage": 0,
                "co2_levels": 0,
                "occupancy": 0
            }
            
            # Process the result (should be just one record after pivot)
            found_data = False
            for table in tables:
                    found_data = True
                    for record in table.records:
                        # Get the value and the metric type from the current row
                        current_value = record.get_value() or 0
                        metric_type = record.values.get("type") # e.g., 'energy', 'water', 'co2'

                        # Assign to the correct dictionary key based on the 'type'
                        if metric_type == "energy":
                            building_data["energy"] = current_value
                        elif metric_type == "water": # Checks for 'water' in DB, maps to 'water_usage'
                            building_data["water_usage"] = current_value
                        elif metric_type == "co2":   # Checks for 'co2' in DB, maps to 'co2_levels'
                            building_data["co2_levels"] = current_value
                        elif metric_type == "occupancy":
                            building_data["occupancy"] = current_value

            if found_data:
                # Calculate sustainability score (Example formula: Weighted average)
                # You can adjust weights: Energy (50%), Water (30%), CO2 (20%)
                # Normalizing values is tricky without max bounds, so this is a simplified heuristic:
                
                energy_score = max(0, 100 - (building_data["energy"] / 5))
                water_score = max(0, 100 - (building_data["water_usage"] / 10))
                co2_score = max(0, 100 - ((building_data["co2_levels"] - 400) / 10)) # Baseline 400ppm
                
                final_score = (energy_score * 0.5) + (water_score * 0.3) + (co2_score * 0.2)

                stats[building] = {
                    "building_id": building,
                    "avg_energy": round(building_data["energy"], 2),
                    "water_usage": round(building_data["water_usage"], 2),
                    "co2_levels": round(building_data["co2_levels"], 2),
                    "occupancy": int(building_data["occupancy"]),
                    "sustainability_score": round(final_score, 0),
                    "status": "good" if final_score > 70 else "warning" if final_score > 40 else "critical"
                }
            else:
                # No data found for this building
                stats[building] = {
                    "building_id": building,
                    "avg_energy": 0,
                    "water_usage": 0,
                    "co2_levels": 0,
                    "occupancy": 0,
                    "sustainability_score": 0,
                    "status": "unknown"
                }
                
        except Exception as e:
            print(f"Error getting stats for {building}: {e}")
            stats[building] = {
                "building_id": building,
                "avg_energy": 0,
                "water_usage": 0,
                "co2_levels": 0,
                "occupancy": 0,
                "sustainability_score": 0,
                "status": "error"
            }
    
    return stats