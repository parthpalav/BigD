"""
AI Insights Endpoints
Featherless.ai powered traffic analysis and recommendations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.traffic import TrafficData, TrafficPrediction, Location
from app.schemas.traffic import AIInsightRequest, AIInsightResponse
from app.services.ai_service import FeatherlessAIService

router = APIRouter()
ai_service = FeatherlessAIService()


@router.post("/{location_id}", response_model=AIInsightResponse)
async def get_traffic_insights(
    location_id: str,
    request: AIInsightRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered traffic insights and analysis
    
    Uses Featherless.ai to analyze current traffic conditions,
    historical patterns, and predictions to provide actionable insights.
    
    - **location_id**: Location to analyze
    - **context**: Optional additional context for analysis
    - **include_recommendations**: Include route/timing recommendations
    """
    # Get location
    location_query = select(Location).where(Location.location_id == location_id)
    location_result = await db.execute(location_query)
    location = location_result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} not found"
        )
    
    # Get current traffic data
    current_query = (
        select(TrafficData)
        .where(TrafficData.location_id == location_id)
        .order_by(TrafficData.timestamp.desc())
        .limit(1)
    )
    current_result = await db.execute(current_query)
    current_data = current_result.scalar_one_or_none()
    
    if not current_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No traffic data available for {location_id}"
        )
    
    # Get predictions
    pred_query = (
        select(TrafficPrediction)
        .where(TrafficPrediction.location_id == location_id)
        .order_by(TrafficPrediction.prediction_time.desc())
        .limit(5)
    )
    pred_result = await db.execute(pred_query)
    predictions = pred_result.scalars().all()
    
    predicted_congestion = [{
        'forecast_hours': p.forecast_horizon,
        'target_time': p.target_time.isoformat(),
        'congestion_level': int(round(p.predicted_congestion)),
        'confidence': p.confidence_score
    } for p in predictions] if predictions else []
    
    # Prepare weather data
    weather_data = None
    if current_data.temperature is not None:
        weather_data = {
            'temperature': current_data.temperature,
            'precipitation': current_data.precipitation,
            'visibility': current_data.visibility,
            'condition': current_data.weather_condition
        }
    
    # Get AI analysis
    try:
        insight = await ai_service.analyze_traffic_situation(
            location_name=location.name,
            current_congestion=current_data.congestion_level or 2,
            predicted_congestion=predicted_congestion,
            historical_patterns=None,  # Could add historical analysis
            weather_data=weather_data
        )
        
        recommendations = None
        if request.include_recommendations:
            # Generate route recommendations
            recommendations = await ai_service.get_route_recommendations(
                origin="Current Location",
                destination=location.name,
                current_traffic={'congestion': current_data.congestion_level},
                predictions={'forecasts': predicted_congestion}
            )
        
        return AIInsightResponse(
            location_id=location_id,
            analysis=insight['analysis'],
            recommendations=recommendations,
            timestamp=datetime.utcnow()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI insight generation failed: {str(e)}"
        )


@router.get("/route/recommendations")
async def get_route_recommendations(
    origin: str,
    destination: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered route recommendations between two points
    
    - **origin**: Starting location ID or name
    - **destination**: Destination location ID or name
    """
    # Get traffic data for origin and destination
    origin_query = select(TrafficData).where(
        TrafficData.location_id == origin
    ).order_by(TrafficData.timestamp.desc()).limit(1)
    
    dest_query = select(TrafficData).where(
        TrafficData.location_id == destination
    ).order_by(TrafficData.timestamp.desc()).limit(1)
    
    origin_result = await db.execute(origin_query)
    dest_result = await db.execute(dest_query)
    
    origin_data = origin_result.scalar_one_or_none()
    dest_data = dest_result.scalar_one_or_none()
    
    current_traffic = {
        'origin_congestion': origin_data.congestion_level if origin_data else None,
        'destination_congestion': dest_data.congestion_level if dest_data else None
    }
    
    # Get predictions
    pred_query = select(TrafficPrediction).where(
        TrafficPrediction.location_id.in_([origin, destination])
    ).order_by(TrafficPrediction.prediction_time.desc()).limit(10)
    
    pred_result = await db.execute(pred_query)
    predictions = pred_result.scalars().all()
    
    predictions_data = {
        'forecasts': [{
            'location': p.location_id,
            'forecast_hours': p.forecast_horizon,
            'congestion': int(round(p.predicted_congestion))
        } for p in predictions]
    }
    
    # Get AI recommendations
    try:
        recommendations = await ai_service.get_route_recommendations(
            origin=origin,
            destination=destination,
            current_traffic=current_traffic,
            predictions=predictions_data
        )
        
        return {
            'origin': origin,
            'destination': destination,
            'recommendations': recommendations,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route recommendation failed: {str(e)}"
        )


@router.get("/analysis/summary")
async def get_city_traffic_summary(
    city: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered city-wide traffic summary
    
    Analyzes traffic across all monitored locations in a city
    """
    # Get all locations in city
    locations_query = select(Location).where(
        Location.city == city,
        Location.is_active == 1
    )
    locations_result = await db.execute(locations_query)
    locations = locations_result.scalars().all()
    
    if not locations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active locations found in {city}"
        )
    
    # Get current traffic for all locations
    location_ids = [loc.location_id for loc in locations]
    traffic_query = select(TrafficData).where(
        TrafficData.location_id.in_(location_ids)
    ).order_by(TrafficData.timestamp.desc())
    
    traffic_result = await db.execute(traffic_query)
    traffic_data = traffic_result.scalars().all()
    
    # Aggregate statistics
    congestion_levels = [d.congestion_level for d in traffic_data[:len(locations)] if d.congestion_level]
    avg_congestion = sum(congestion_levels) / len(congestion_levels) if congestion_levels else 0
    
    hotspots = [
        {
            'location': next((loc.name for loc in locations if loc.location_id == d.location_id), d.location_id),
            'congestion': d.congestion_level
        }
        for d in traffic_data[:10]
        if d.congestion_level and d.congestion_level >= 4
    ]
    
    summary = {
        'city': city,
        'total_locations': len(locations),
        'average_congestion': round(avg_congestion, 1),
        'hotspots': hotspots[:5],
        'timestamp': datetime.utcnow().isoformat()
    }
    
    return summary
