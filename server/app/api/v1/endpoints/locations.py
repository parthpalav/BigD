"""
Location Management Endpoints
Monitor and manage traffic locations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.models.traffic import Location
from app.schemas.traffic import LocationCreate, LocationResponse

router = APIRouter()


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location: LocationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new traffic monitoring location
    
    - **location_id**: Unique identifier
    - **name**: Descriptive name (e.g., "Main St & 5th Ave")
    - **latitude/longitude**: Geographic coordinates
    - **city/area**: Geographic context
    - **road_type**: highway, arterial, local
    """
    # Check if location already exists
    query = select(Location).where(Location.location_id == location.location_id)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Location {location.location_id} already exists"
        )
    
    db_location = Location(**location.model_dump())
    db.add(db_location)
    await db.commit()
    await db.refresh(db_location)
    
    return db_location


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get location by ID"""
    query = select(Location).where(Location.location_id == location_id)
    result = await db.execute(query)
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} not found"
        )
    
    return location


@router.get("/", response_model=List[LocationResponse])
async def list_locations(
    city: str = Query(None, description="Filter by city"),
    road_type: str = Query(None, description="Filter by road type"),
    is_active: int = Query(1, description="Filter active locations"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all monitored locations with optional filters"""
    query = select(Location).where(Location.is_active == is_active)
    
    if city:
        query = query.where(Location.city == city)
    
    if road_type:
        query = query.where(Location.road_type == road_type)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    locations = result.scalars().all()
    
    return locations


@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    name: str = None,
    is_active: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Update location details"""
    query = select(Location).where(Location.location_id == location_id)
    result = await db.execute(query)
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} not found"
        )
    
    if name is not None:
        location.name = name
    
    if is_active is not None:
        location.is_active = is_active
    
    await db.commit()
    await db.refresh(location)
    
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_location(
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a location (soft delete)"""
    query = select(Location).where(Location.location_id == location_id)
    result = await db.execute(query)
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location {location_id} not found"
        )
    
    location.is_active = 0
    await db.commit()
    
    return None


@router.get("/search/nearby")
async def search_nearby_locations(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(5.0, ge=0.1, le=50.0),
    db: AsyncSession = Depends(get_db)
):
    """
    Find locations near a point
    
    - **latitude/longitude**: Center point
    - **radius_km**: Search radius in kilometers
    """
    # Get all active locations
    query = select(Location).where(Location.is_active == 1)
    result = await db.execute(query)
    all_locations = result.scalars().all()
    
    # Filter by distance (simplified calculation)
    nearby = []
    for loc in all_locations:
        lat_diff = abs(loc.latitude - latitude)
        lon_diff = abs(loc.longitude - longitude)
        distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
        
        if distance <= radius_km:
            nearby.append({
                'location_id': loc.location_id,
                'name': loc.name,
                'latitude': loc.latitude,
                'longitude': loc.longitude,
                'city': loc.city,
                'area': loc.area,
                'road_type': loc.road_type,
                'distance_km': round(distance, 2)
            })
    
    # Sort by distance
    nearby.sort(key=lambda x: x['distance_km'])
    
    return {
        'center': {'latitude': latitude, 'longitude': longitude},
        'radius_km': radius_km,
        'locations': nearby,
        'count': len(nearby)
    }


@router.get("/stats/overview")
async def get_locations_overview(
    db: AsyncSession = Depends(get_db)
):
    """Get overview statistics of all locations"""
    total_query = select(func.count(Location.id))
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    active_query = select(func.count(Location.id)).where(Location.is_active == 1)
    active_result = await db.execute(active_query)
    active = active_result.scalar()
    
    cities_query = select(func.count(func.distinct(Location.city)))
    cities_result = await db.execute(cities_query)
    cities = cities_result.scalar()
    
    return {
        'total_locations': total,
        'active_locations': active,
        'unique_cities': cities
    }
