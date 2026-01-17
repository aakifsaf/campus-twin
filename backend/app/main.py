from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.api.endpoints import data, predictions, websocket
from app.db.influx_client import init_influxdb

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events."""
    # Startup - don't block on InfluxDB
    print("Starting application...")
    
    # Start InfluxDB connection in background
    import threading
    def init_db():
        from app.db.influx_client import init_influxdb
        init_influxdb()
    
    db_thread = threading.Thread(target=init_db, daemon=True)
    db_thread.start()
    
    print("Application startup initiated (InfluxDB connecting in background)...")
    
    yield
    
    # Shutdown
    print("Application shutdown...")

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
app.include_router(predictions.router, prefix=f"{settings.API_V1_STR}/predict", tags=["predictions"])
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