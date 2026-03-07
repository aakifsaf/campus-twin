from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import asyncio
from app.core.config import settings
from app.api.endpoints import data, predictions, websocket
from app.db.influx_client import init_influxdb
from app.db.influx_client import create_initial_data
from app.simulation.data_generator import data_generator

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting application...")
    
    init_influxdb() 
    seed_task = asyncio.create_task(run_seeding_in_background())
    sim_task = asyncio.create_task(data_generator.start_continuous_simulation(interval_seconds=300))
    
    print("✅ Port binding in progress, seeding will continue in background.")
    yield
    data_generator.stop_simulation()
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        print("✅ Continuous simulation stopped gracefully.")
    print("🛑 Application shutdown...")

async def run_seeding_in_background():
    try:
        await asyncio.to_thread(create_initial_data)
        print("📊 Initial data seeding completed successfully.")
    except Exception as e:
        print(f"⚠️ Background seeding failed: {e}")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Digital Twin API for Sustainable Smart Campuses",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(data.router, prefix=f"{settings.API_V1_STR}/data", tags=["data"])
app.include_router(predictions.router, prefix=f"{settings.API_V1_STR}/ml", tags=["predictions"])
app.include_router(websocket.router, prefix=f"{settings.API_V1_STR}/ws", tags=["websocket"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Smart Campus Digital Twin API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "smart-campus-api"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )