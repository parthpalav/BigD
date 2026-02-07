"""
Traffic Data Endpoints
Ingestion and retrieval of traffic data from multiple sources
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.traffic import TrafficData
from app.schemas.traffic import TrafficDataCreate, TrafficDataResponse

router = APIRouter()


@router.post("/", response_model=TrafficDataResponse, status_code=status.HTTP_201_CREATED)
async def create_traffic_data(
    data: TrafficDataCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest traffic data from GPS, sensors, or external sources
    
    - **location_id**: Unique location identifier
    - **latitude/longitude**: Geographic coordinates
    - **congestion_level**: 1-5 scale (1=clear, 5=severe)
    - **average_speed**: km/h
    - **vehicle_count**: Number of vehicles detected
    - **weather data**: Temperature, precipitation, visibility
    - **event_nearby**: Boolean for nearby city events
    """
    # Calculate derived features
    timestamp = data.timestamp
    hour_of_day = timestamp.hour
    day_of_week = timestamp.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    
    # Create traffic data record
    traffic_record = TrafficData(
        **data.model_dump(),
        hour_of_day=hour_of_day,
        day_of_week=day_of_week,
        is_weekend=is_weekend
    )
    
    db.add(traffic_record)
    await db.commit()
    await db.refresh(traffic_record)
    
    return traffic_record


@router.post("/batch", status_code=status.HTTP_201_CREATED)
async def create_traffic_data_batch(
    data_list: List[TrafficDataCreate],
    db: AsyncSession = Depends(get_db)
):
    """
    Batch ingest multiple traffic data records
    Optimized for bulk data imports from sensors or GPS systems
    """
    records = []
    
    for data in data_list:
        timestamp = data.timestamp
        traffic_record = TrafficData(
            **data.model_dump(),
            hour_of_day=timestamp.hour,
            day_of_week=timestamp.weekday(),
            is_weekend=1 if timestamp.weekday() >= 5 else 0
        )
        records.append(traffic_record)
    
    db.add_all(records)
    await db.commit()
    
    return {
        "message": f"Successfully ingested {len(records)} traffic data records",
        "count": len(records)
    }


@router.get("/{location_id}/latest", response_model=TrafficDataResponse)
async def get_latest_traffic_data(
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent traffic data for a location"""
    query = (
        select(TrafficData)
        .where(TrafficData.location_id == location_id)
        .order_by(TrafficData.timestamp.desc())
        .limit(1)
    )
    
    result = await db.execute(query)
    traffic_data = result.scalar_one_or_none()
    
    if not traffic_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No traffic data found for location {location_id}"
        )
    
    return traffic_data


@router.get("/{location_id}/history", response_model=List[TrafficDataResponse])
async def get_traffic_history(
    location_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours of history (1-168)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get historical traffic data for a location
    
    - **hours**: Number of hours to look back (default: 24, max: 168/1 week)
    """
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = (
        select(TrafficData)
        .where(
            TrafficData.location_id == location_id,
            TrafficData.timestamp >= start_time
        )
        .order_by(TrafficData.timestamp.desc())
    )
    
    result = await db.execute(query)
    traffic_data = result.scalars().all()
    
    return traffic_data


@router.get("/{location_id}/stats")
async def get_traffic_stats(
    location_id: str,
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistical summary of traffic data
    
    Returns average congestion, speed, vehicle count, and incident frequency
    """
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = select(
        func.avg(TrafficData.congestion_level).label('avg_congestion'),
        func.max(TrafficData.congestion_level).label('max_congestion'),
        func.avg(TrafficData.average_speed).label('avg_speed'),
        func.avg(TrafficData.vehicle_count).label('avg_vehicle_count'),
        func.sum(TrafficData.incident_reported).label('total_incidents'),
        func.count(TrafficData.id).label('data_points')
    ).where(
        TrafficData.location_id == location_id,
        TrafficData.timestamp >= start_time
    )
    
    result = await db.execute(query)
    stats = result.first()
    
    if not stats or stats.data_points == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No traffic data found for location {location_id}"
        )
    
    return {
        "location_id": location_id,
        "period_hours": hours,
        "average_congestion": round(float(stats.avg_congestion or 0), 2),
        "max_congestion": stats.max_congestion,
        "average_speed": round(float(stats.avg_speed or 0), 2),
        "average_vehicle_count": round(float(stats.avg_vehicle_count or 0), 0),
        "total_incidents": stats.total_incidents,
        "data_points": stats.data_points
    }


@router.get("/area/current")
async def get_area_traffic(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5.0, ge=0.1, le=50.0, description="Search radius in km"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current traffic data for all locations within radius
    
    - **latitude/longitude**: Center point
    - **radius_km**: Search radius in kilometers
    """
    # Simplified distance calculation (Haversine would be more accurate)
    # For production, consider using PostGIS or proper geographic queries
    
    # Get recent data (last 30 minutes)
    recent_time = datetime.utcnow() - timedelta(minutes=30)
    
    query = (
        select(TrafficData)
        .where(TrafficData.timestamp >= recent_time)
        .order_by(TrafficData.timestamp.desc())
    )
    
    result = await db.execute(query)
    all_data = result.scalars().all()
    
    # Filter by distance (simplified)
    nearby_data = []
    for data in all_data:
        # Simple distance estimation
        lat_diff = abs(data.latitude - latitude)
        lon_diff = abs(data.longitude - longitude)
        approx_distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111  # rough km conversion
        
        if approx_distance <= radius_km:
            nearby_data.append({
                "location_id": data.location_id,
                "latitude": data.latitude,
                "longitude": data.longitude,
                "congestion_level": data.congestion_level,
                "average_speed": data.average_speed,
                "timestamp": data.timestamp.isoformat(),
                "distance_km": round(approx_distance, 2)
            })
    
    return {
        "center": {"latitude": latitude, "longitude": longitude},
        "radius_km": radius_km,
        "locations": nearby_data,
        "count": len(nearby_data)
    }
