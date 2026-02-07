"""
Alert Management Endpoints
Create and manage traffic alerts
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.traffic import Alert, User
from app.schemas.traffic import AlertCreate, AlertResponse
from app.services.notification_service import NotificationService

router = APIRouter()
notification_service = NotificationService()


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert: AlertCreate,
    send_immediately: bool = Query(True, description="Send alert immediately"),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new traffic alert
    
    - **user_id**: Target user
    - **location_id**: Location related to alert
    - **alert_type**: congestion, incident, weather, prediction
    - **severity**: low, medium, high, critical
    - **title**: Alert title
    - **message**: Alert message body
    - **send_immediately**: Send via enabled channels immediately
    """
    # Create alert record
    db_alert = Alert(**alert.model_dump())
    db.add(db_alert)
    await db.commit()
    await db.refresh(db_alert)
    
    # Send notification if requested
    if send_immediately:
        # Get user preferences
        user_query = select(User).where(User.user_id == alert.user_id)
        user_result = await db.execute(user_query)
        user = user_result.scalar_one_or_none()
        
        if user and user.is_active:
            # Prepare alert data
            alert_data = {
                'title': alert.title,
                'message': alert.message,
                'severity': alert.severity,
                'location': alert.location_id,
                'data': {
                    'alert_id': str(db_alert.id),
                    'location_id': alert.location_id,
                    'alert_type': alert.alert_type
                }
            }
            
            # Send via all enabled channels
            user_prefs = {
                'user_id': user.user_id,
                'email': user.email,
                'phone': user.phone,
                'fcm_token': user.fcm_token,
                'push_enabled': user.push_enabled,
                'email_enabled': user.email_enabled,
                'sms_enabled': user.sms_enabled,
                'whatsapp_enabled': user.whatsapp_enabled
            }
            
            results = await notification_service.send_multi_channel_alert(user_prefs, alert_data)
            
            # Update alert status
            db_alert.sent_push = 1 if results.get('push') else 0
            db_alert.sent_email = 1 if results.get('email') else 0
            db_alert.sent_sms = 1 if results.get('sms') else 0
            db_alert.sent_whatsapp = 1 if results.get('whatsapp') else 0
            db_alert.status = 'sent' if any(results.values()) else 'failed'
            db_alert.delivered_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(db_alert)
    
    return db_alert


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get alert by ID"""
    query = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )
    
    return alert


@router.get("/user/{user_id}", response_model=List[AlertResponse])
async def get_user_alerts(
    user_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours of alert history"),
    db: AsyncSession = Depends(get_db)
):
    """Get all alerts for a user within timeframe"""
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = (
        select(Alert)
        .where(
            and_(
                Alert.user_id == user_id,
                Alert.created_at >= start_time
            )
        )
        .order_by(Alert.created_at.desc())
    )
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return alerts


@router.patch("/{alert_id}/read")
async def mark_alert_read(
    alert_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark alert as read"""
    query = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )
    
    alert.read_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Alert marked as read"}


@router.post("/broadcast/{location_id}")
async def broadcast_alert_to_location(
    location_id: str,
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Broadcast alert to all users monitoring a specific location
    
    Useful for sending congestion warnings to all affected users
    """
    # Find all users monitoring this location
    query = select(User).where(User.is_active == 1)
    result = await db.execute(query)
    all_users = result.scalars().all()
    
    # Filter users who have this location in preferences
    target_users = [
        user for user in all_users
        if user.preferred_locations and location_id in user.preferred_locations
    ]
    
    if not target_users:
        return {"message": "No users monitoring this location", "sent": 0}
    
    sent_count = 0
    
    for user in target_users:
        # Create alert
        alert = Alert(
            user_id=user.user_id,
            location_id=location_id,
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message
        )
        db.add(alert)
        await db.flush()
        
        # Send notification
        alert_data = {
            'title': title,
            'message': message,
            'severity': severity,
            'location': location_id,
            'data': {
                'alert_id': str(alert.id),
                'location_id': location_id,
                'alert_type': alert_type
            }
        }
        
        user_prefs = {
            'user_id': user.user_id,
            'email': user.email,
            'phone': user.phone,
            'fcm_token': user.fcm_token,
            'push_enabled': user.push_enabled,
            'email_enabled': user.email_enabled,
            'sms_enabled': user.sms_enabled,
            'whatsapp_enabled': user.whatsapp_enabled
        }
        
        results = await notification_service.send_multi_channel_alert(user_prefs, alert_data)
        
        if any(results.values()):
            alert.sent_push = 1 if results.get('push') else 0
            alert.sent_email = 1 if results.get('email') else 0
            alert.sent_sms = 1 if results.get('sms') else 0
            alert.sent_whatsapp = 1 if results.get('whatsapp') else 0
            alert.status = 'sent'
            alert.delivered_at = datetime.utcnow()
            sent_count += 1
    
    await db.commit()
    
    return {
        "message": f"Alert broadcasted to {len(target_users)} users",
        "location_id": location_id,
        "total_users": len(target_users),
        "sent_successfully": sent_count
    }
