"""
User Management Endpoints
User accounts and notification preferences
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.traffic import User
from app.schemas.traffic import UserCreate, UserUpdate, UserResponse

router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user account
    
    - **user_id**: Unique user identifier
    - **email**: User email for notifications
    - **phone**: Optional phone number for SMS/WhatsApp
    - **fcm_token**: Firebase Cloud Messaging token for push notifications
    - **preferred_locations**: List of location IDs to monitor
    - **alert_threshold**: Congestion level (1-5) that triggers alerts
    """
    # Check if user already exists
    existing_query = select(User).where(User.user_id == user.user_id)
    result = await db.execute(existing_query)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with ID {user.user_id} already exists"
        )
    
    # Create new user
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID"""
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update user preferences
    
    - **push_enabled/email_enabled/sms_enabled/whatsapp_enabled**: Toggle notification channels
    - **preferred_locations**: Update monitored locations
    - **alert_threshold**: Change congestion alert threshold
    - **quiet_hours**: Set do-not-disturb hours (0-23)
    """
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    # Update fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Deactivate user account"""
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    user.is_active = 0
    await db.commit()
    
    return None


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all active users"""
    query = (
        select(User)
        .where(User.is_active == 1)
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.post("/{user_id}/fcm-token")
async def update_fcm_token(
    user_id: str,
    fcm_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Update Firebase Cloud Messaging token for push notifications"""
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    user.fcm_token = fcm_token
    await db.commit()
    
    return {"message": "FCM token updated successfully"}


@router.post("/{user_id}/locations/{location_id}")
async def add_preferred_location(
    user_id: str,
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Add a location to user's monitoring list"""
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    preferred = user.preferred_locations or []
    if location_id not in preferred:
        preferred.append(location_id)
        user.preferred_locations = preferred
        await db.commit()
    
    return {"message": f"Location {location_id} added to preferences"}


@router.delete("/{user_id}/locations/{location_id}")
async def remove_preferred_location(
    user_id: str,
    location_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Remove a location from user's monitoring list"""
    query = select(User).where(User.user_id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    preferred = user.preferred_locations or []
    if location_id in preferred:
        preferred.remove(location_id)
        user.preferred_locations = preferred
        await db.commit()
    
    return {"message": f"Location {location_id} removed from preferences"}
