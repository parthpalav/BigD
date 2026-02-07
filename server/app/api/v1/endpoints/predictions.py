"""
Prediction Endpoints
ML-based traffic congestion forecasting
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.traffic import TrafficData, TrafficPrediction, Location
from app.schemas.traffic import PredictionRequest, PredictionResponse
from app.services.ml_service import MLService
from app.core.cache import get_cache, set_cache
import pandas as pd

router = APIRouter()
ml_service = MLService()


@router.post("/{location_id}", response_model=PredictionResponse)
async def predict_traffic(
    location_id: str,
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate traffic congestion predictions using ML models
    
    - **location_id**: Location to predict
    - **forecast_hours**: List of hours to forecast (e.g., [1, 3, 6, 12, 24])
    - **include_features**: Include feature importance in response
    
    Returns predictions with confidence scores
    """
    # Validate location exists
    location_query = select(Location).where(Location.location_id == location_id)
    location_result = await db.execute(location_query)
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} not found"
        )
    
    # Get latest traffic data
    latest_query = (
        select(TrafficData)
        .where(TrafficData.location_id == location_id)
        .order_by(TrafficData.timestamp.desc())
        .limit(1)
    )
    latest_result = await db.execute(latest_query)
    latest_data = latest_result.scalar_one_or_none()
    
    if not latest_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No traffic data found for location {location_id}"
        )
    
    # Get historical data for lag features (last 24 hours)
    historical_query = (
        select(TrafficData)
        .where(TrafficData.location_id == location_id)
        .order_by(TrafficData.timestamp.desc())
        .limit(24)
    )
    historical_result = await db.execute(historical_query)
    historical_data_records = historical_result.scalars().all()
    
    # Convert to DataFrame
    historical_df = pd.DataFrame([{
        'congestion_level': d.congestion_level,
        'average_speed': d.average_speed,
        'timestamp': d.timestamp
    } for d in historical_data_records])
    
    # Prepare current data
    current_data = {
        'timestamp': datetime.utcnow(),
        'temperature': latest_data.temperature or 20.0,
        'precipitation': latest_data.precipitation or 0.0,
        'visibility': latest_data.visibility or 10.0,
        'vehicle_count': latest_data.vehicle_count or 100,
        'average_speed': latest_data.average_speed or 40.0,
        'incident_reported': latest_data.incident_reported or 0,
        'event_nearby': latest_data.event_nearby or 0,
        'congestion_level': latest_data.congestion_level or 2,
        'is_holiday': latest_data.is_holiday or 0
    }
    
    # Generate predictions
    try:
        predictions = await ml_service.predict_congestion_xgboost(
            location_id=location_id,
            current_data=current_data,
            forecast_hours=request.forecast_hours,
            historical_data=historical_df if not historical_df.empty else None
        )
        
        # Store predictions in database
        for pred in predictions:
            prediction_record = TrafficPrediction(
                location_id=location_id,
                latitude=location.latitude,
                longitude=location.longitude,
                prediction_time=datetime.utcnow(),
                target_time=datetime.fromisoformat(pred['target_time']),
                forecast_horizon=pred['forecast_hours'],
                predicted_congestion=pred['predicted_congestion'],
                confidence_score=pred['confidence'],
                model_type=pred['model'],
                model_version='1.0',
                features=current_data
            )
            db.add(prediction_record)
        
        await db.commit()
        
        response = {
            'location_id': location_id,
            'location_name': location.name,
            'prediction_time': datetime.utcnow(),
            'forecasts': predictions,
            'model_type': 'xgboost',
            'model_version': '1.0'
        }
        
        if request.include_features:
            response['feature_importance'] = ml_service.get_feature_importance()
        
        return response
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


@router.get("/{location_id}/latest")
async def get_latest_prediction(
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent prediction for a location"""
    query = (
        select(TrafficPrediction)
        .where(TrafficPrediction.location_id == location_id)
        .order_by(TrafficPrediction.prediction_time.desc())
        .limit(5)
    )
    
    result = await db.execute(query)
    predictions = result.scalars().all()
    
    if not predictions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No predictions found for location {location_id}"
        )
    
    return {
        'location_id': location_id,
        'prediction_time': predictions[0].prediction_time,
        'forecasts': [{
            'target_time': p.target_time.isoformat(),
            'forecast_hours': p.forecast_horizon,
            'predicted_congestion': p.predicted_congestion,
            'congestion_level': int(round(p.predicted_congestion)),
            'confidence': p.confidence_score,
            'model': p.model_type
        } for p in predictions]
    }


@router.get("/model/info")
async def get_model_info():
    """Get information about loaded ML models"""
    return ml_service.get_model_info()


@router.get("/model/features")
async def get_feature_importance():
    """Get feature importance from the XGBoost model"""
    importance = ml_service.get_feature_importance()
    
    if not importance:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Feature importance not available"
        )
    
    # Sort by importance
    sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
    
    return {
        'features': [
            {'name': name, 'importance': value}
            for name, value in sorted_features
        ],
        'model_type': 'xgboost'
    }
