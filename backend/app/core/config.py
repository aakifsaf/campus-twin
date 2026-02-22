from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Smart Campus Digital Twin"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://localhost","http://localhost:80","https://campus-twin.vercel.app"]
    
    # InfluxDB Configuration
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: str = "my-super-secret-auth-token"
    INFLUXDB_ORG: str = "campus_org"
    INFLUXDB_BUCKET: str = "campus_data"
    
    # Simulation Settings
    SIMULATION_INTERVAL: int = 5  # seconds between data points
    CAMPUS_BUILDINGS: int = 10
    
    # ML Settings
    ML_MODEL_PATH: str = "models/"
    DEBUG: bool = False

    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()