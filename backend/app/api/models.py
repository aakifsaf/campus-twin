from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SensorDataPoint(BaseModel):
    building_id: str = Field(..., description="Building identifier")
    data_type: str = Field(..., description="Type of data (energy, water, etc.)")
    value: float = Field(..., description="Sensor reading value")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of reading")

class SensorDataResponse(BaseModel):
    data: List[Dict[str, Any]]
    count: int
    time_range: Dict[str, str]

class BuildingStats(BaseModel):
    building_id: str
    avg_energy: float
    sustainability_score: float
    status: str
    water_usage: Optional[float] = None
    occupancy: Optional[int] = None
    co2_levels: Optional[float] = None

class BuildingStatsResponse(BaseModel):
    buildings: List[BuildingStats]
    timestamp: datetime
    campus_avg_score: float

class PredictionRequest(BaseModel):
    building_id: str
    data_type: str
    hours_ahead: int = Field(24, ge=1, le=168, description="Hours to predict ahead")
    include_anomaly: bool = False

class PredictionResponse(BaseModel):
    building_id: str
    data_type: str
    predictions: List[Dict[str, Any]]
    confidence: float
    anomalies: Optional[List[Dict[str, Any]]] = None

class WhatIfSimulation(BaseModel):
    building_id: str
    scenario: str = Field(..., description="solar_panels, led_lights, water_recycling")
    parameters: Dict[str, Any]
    duration_days: int = 30

class SimulationResult(BaseModel):
    building_id: str
    scenario: str
    initial_consumption: float
    projected_consumption: float
    reduction_percentage: float
    cost_savings: float
    co2_reduction: float
    payback_period_years: Optional[float] = None

class WebSocketMessage(BaseModel):
    type: str = Field(..., description="Message type: data_update, anomaly, prediction")
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)