import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, Any
import numpy as np

from app.db.influx_client import write_sensor_data
from app.core.config import settings

class DataGenerator:
    def __init__(self):
        self.buildings = [f"building_{i}" for i in range(1, settings.CAMPUS_BUILDINGS + 1)]
        self.data_types = ["energy", "water", "occupancy", "temperature", "co2"]
        
        # Base values for each building type
        self.building_profiles = {
            "academic": {"energy_base": 120, "water_base": 300, "occupancy_base": 150},
            "residential": {"energy_base": 80, "water_base": 200, "occupancy_base": 50},
            "administrative": {"energy_base": 100, "water_base": 150, "occupancy_base": 80},
            "library": {"energy_base": 150, "water_base": 100, "occupancy_base": 100},
            "laboratory": {"energy_base": 200, "water_base": 400, "occupancy_base": 30}
        }
        
        # Assign random profiles to buildings
        self.building_types = {}
        for building in self.buildings:
            self.building_types[building] = random.choice(list(self.building_profiles.keys()))
    
    def generate_sensor_value(self, building_id: str, data_type: str) -> float:
        """Generate realistic sensor value (always returns float)"""
        profile = self.building_profiles[self.building_types[building_id]]
        
        # Get base value (always as float)
        if data_type == "energy":
            base = float(profile["energy_base"])
        elif data_type == "water":
            base = float(profile["water_base"])
        elif data_type == "occupancy":
            base = float(profile["occupancy_base"])  # Convert occupancy to float
        elif data_type == "temperature":
            base = 22.0  # Room temperature
        elif data_type == "co2":
            base = 600.0  # ppm
        else:
            base = 100.0  # Default
        
        # Add time-based variation
        hour = datetime.now().hour
        minute = datetime.now().minute
        
        # Daily pattern
        if 8 <= hour <= 18:  # Daytime peak
            multiplier = 1.5 + 0.5 * np.sin((hour - 8) * np.pi / 10)
        elif 19 <= hour <= 22:  # Evening
            multiplier = 0.8 + 0.2 * np.sin((hour - 19) * np.pi / 4)
        else:  # Night
            multiplier = 0.4 + 0.1 * np.sin(hour * np.pi / 12)
        
        # Add random noise
        noise = random.uniform(-0.1, 0.1)
        
        # Add minute-by-minute small variations
        minute_variation = 0.1 * np.sin(minute * np.pi / 30)
        
        # Calculate final value
        value = base * multiplier * (1 + noise + minute_variation)
        
        # Ensure reasonable ranges
        if data_type == "temperature":
            value = max(18.0, min(28.0, value))
        elif data_type == "co2":
            value = max(400.0, min(1200.0, value))
        elif data_type == "occupancy":
            value = max(0.0, value)  # Occupancy can't be negative
        elif data_type in ["energy", "water"]:
            value = max(0.0, value)  # Resource usage can't be negative
        
        return round(value, 2)
    
    def generate_anomaly(self, building_id: str, data_type: str, base_value: float) -> float:
        """Generate anomalous data point"""
        anomaly_types = ["spike", "drop", "gradual_increase", "gradual_decrease"]
        anomaly_type = random.choice(anomaly_types)
        
        if anomaly_type == "spike":
            return base_value * random.uniform(2.0, 5.0)
        elif anomaly_type == "drop":
            return base_value * random.uniform(0.1, 0.3)
        elif anomaly_type == "gradual_increase":
            return base_value * random.uniform(1.1, 1.5)
        elif anomaly_type == "gradual_decrease":
            return base_value * random.uniform(0.5, 0.9)
        
        return base_value
    
    async def generate_realtime_data(self, duration_minutes: int, interval_seconds: int):
        """Generate real-time data stream"""
        end_time = datetime.now() + timedelta(minutes=duration_minutes)
        anomaly_probability = 0.05  # 5% chance of anomaly
        
        print(f"Starting real-time data generation for {duration_minutes} minutes...")
        
        while datetime.now() < end_time:
            for building in self.buildings:
                for data_type in self.data_types:
                    # Generate normal value
                    value = self.generate_sensor_value(building, data_type)
                    
                    # Check for anomaly
                    if random.random() < anomaly_probability:
                        value = self.generate_anomaly(building, data_type, value)
                        print(f"ANOMALY: {building} {data_type}: {value}")
                    
                    # Write to database
                    write_sensor_data(building, data_type, value)
            
            print(f"Generated data batch at {datetime.now().strftime('%H:%M:%S')}")
            
            # Wait for next interval
            await asyncio.sleep(interval_seconds)
        
        print("Real-time data generation completed")

# Singleton instance
data_generator = DataGenerator()

async def generate_realtime_data(duration_minutes: int = 5, interval_seconds: int = 2):
    """Public function to start data generation"""
    await data_generator.generate_realtime_data(duration_minutes, interval_seconds)