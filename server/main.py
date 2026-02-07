"""
Main FastAPI Application Entry Point
Urban Traffic Congestion Forecasting System
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.cache import init_redis, close_redis
from app.api.v1 import api_router
from app.services.ml_service import MLService

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting up Urban Traffic Congestion API...")
    
    # Initialize database
    await init_db()
    logger.info("✓ Database connected")
    
    # Initialize Redis
    await init_redis()
    logger.info("✓ Redis connected")
    
    # Load ML models
    ml_service = MLService()
    await ml_service.load_models()
    logger.info("✓ ML models loaded")
    
    yield
    
    # Cleanup
    logger.info("Shutting down...")
    await close_redis()
    await close_db()
    logger.info("✓ Cleanup complete")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="ML-based time-series forecasting system for urban traffic congestion",
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url=f"/api/{settings.API_VERSION}/docs",
    redoc_url=f"/api/{settings.API_VERSION}/redoc",
    openapi_url=f"/api/{settings.API_VERSION}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.APP_NAME,
        "version": settings.API_VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """API root"""
    return {
        "message": "Urban Traffic Congestion Forecasting API",
        "version": settings.API_VERSION,
        "docs": f"/api/{settings.API_VERSION}/docs"
    }


# Include API routes
app.include_router(api_router, prefix=f"/api/{settings.API_VERSION}")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
