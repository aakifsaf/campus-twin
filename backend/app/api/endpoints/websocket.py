from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import asyncio
import json
from datetime import datetime
import random

from app.api.models import WebSocketMessage
from app.db.influx_client import get_building_stats

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New WebSocket connection. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                self.active_connections.remove(connection)

manager = ConnectionManager()

@router.websocket("/real-time")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        # Send initial data
        initial_stats = get_building_stats()
        initial_message = WebSocketMessage(
            type="initial_data",
            data={"buildings": initial_stats, "timestamp": datetime.utcnow().isoformat()}
        )
        await websocket.send_text(initial_message.json())
        
        # Keep connection alive and send updates
        while True:
            # Wait for client message (could be used for subscriptions)
            data = await websocket.receive_text()
            client_data = json.loads(data)
            
            # Handle client requests
            if client_data.get("type") == "subscribe":
                building_id = client_data.get("building_id")
                await handle_subscription(websocket, building_id)
            elif client_data.get("type") == "request_update":
                await send_stats_update(websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def handle_subscription(websocket: WebSocket, building_id: str):
    """Handle building-specific subscriptions"""
    # For now, just acknowledge
    ack_message = WebSocketMessage(
        type="subscription_ack",
        data={"building_id": building_id, "status": "subscribed"}
    )
    await websocket.send_text(ack_message.json())

async def send_stats_update(websocket: WebSocket):
    """Send updated building stats"""
    stats = get_building_stats()
    
    update_message = WebSocketMessage(
        type="stats_update",
        data={
            "buildings": stats,
            "timestamp": datetime.utcnow().isoformat(),
            "campus_avg": sum(b['sustainability_score'] for b in stats.values() if b['sustainability_score'] > 0) / len(stats)
        }
    )
    
    await websocket.send_text(update_message.json())

# Background task to broadcast periodic updates
async def broadcast_updates():
    """Periodically broadcast updates to all connected clients"""
    while True:
        if manager.active_connections:
            stats = get_building_stats()
            
            # Simulate some real-time changes
            for building in stats:
                # Add small random variations
                stats[building]['sustainability_score'] += random.uniform(-1, 1)
                stats[building]['sustainability_score'] = max(0, min(100, stats[building]['sustainability_score']))
                
                # Update status based on score
                score = stats[building]['sustainability_score']
                if score > 70:
                    stats[building]['status'] = 'good'
                elif score > 40:
                    stats[building]['status'] = 'warning'
                else:
                    stats[building]['status'] = 'critical'
            
            update_message = WebSocketMessage(
                type="real_time_update",
                data={
                    "buildings": stats,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            await manager.broadcast(update_message.json())
        
        # Wait 10 seconds before next update
        await asyncio.sleep(10)

# Start broadcast task when module loads
import asyncio
asyncio.create_task(broadcast_updates())