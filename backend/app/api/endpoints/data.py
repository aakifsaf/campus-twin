from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from datetime import datetime, timedelta
from typing import List, Optional
import asyncio

from app.db.influx_client import query_sensor_data, get_building_stats, write_sensor_data
from app.api.models import SensorDataResponse, BuildingStatsResponse
from app.simulation.data_generator import data_generator

router = APIRouter()

@router.get("/sensor", response_model=SensorDataResponse)
async def get_sensor_data(
    building_id: Optional[str] = Query(None, description="Filter by building ID"),
    data_type: Optional[str] = Query(None, description="Filter by data type"),
    hours: int = Query(24, description="Hours of data to retrieve", ge=1, le=720),
    limit: int = Query(1000, description="Maximum data points", ge=1, le=10000)
):
    """
    Retrieve sensor data from InfluxDB
    """
    try:
        data = query_sensor_data(building_id, data_type, hours, limit)
        
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        return SensorDataResponse(
            data=data,
            count=len(data),
            time_range={
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving data: {str(e)}")

@router.get("/stats", response_model=BuildingStatsResponse)
async def get_building_statistics(
    hours: int = Query(720, description="Hours of data to retrieve", ge=1, le=720)
):
    """
    Get sustainability statistics for all buildings
    """
    try:
        # Pass the hours variable to the function
        stats = get_building_stats(hours) 
        buildings_list = list(stats.values())
        
        # Calculate campus average score
        scores = [b['sustainability_score'] for b in buildings_list if b['sustainability_score'] > 0]
        campus_avg = sum(scores) / len(scores) if scores else 0
        
        return BuildingStatsResponse(
            buildings=buildings_list,
            timestamp=datetime.utcnow(),
            campus_avg_score=round(campus_avg, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")

@router.get("/simulation/status")
def get_simulation_status():
    """Check if the automated data stream is currently running"""
    return {
        "is_running": data_generator.is_running,
        "buildings_tracked": len(data_generator.buildings)
    }

@router.post("/simulation/toggle")
def toggle_simulation():
    """Pause or Resume the automated data generation"""
    if data_generator.is_running:
        data_generator.stop_simulation()
        return {"status": "paused", "message": "Simulation stopped."}
    else:
        # Start it back up in the background
        asyncio.create_task(data_generator.start_continuous_simulation(interval_seconds=300))
        return {"status": "running", "message": "Simulation resumed."}

@router.get("/buildings")
async def get_buildings_list():
    """
    Get list of all buildings
    """
    buildings = []
    for i in range(1, 11):  # 10 buildings
        buildings.append({
            "id": f"building_{i}",
            "name": f"Campus Building {i}",
            "type": random.choice(["academic", "residential", "administrative", "library", "laboratory"]),
            "floor_area": random.randint(1000, 10000),
            "year_built": random.randint(1960, 2020)
        })
    
    return buildings

@router.post("/manual-data")
async def add_manual_data(
    building_id: str,
    data_type: str,
    value: float
):
    """
    Add manual sensor data (for testing)
    """
    try:
        success = write_sensor_data(building_id, data_type, value)
        
        if success:
            return {"message": "Data added successfully", "building_id": building_id}
        else:
            raise HTTPException(status_code=500, detail="Failed to write data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding data: {str(e)}")

import random