"""
Pydantic Schemas for Request/Response Validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class CongestionLevel(int, Enum):
    """Congestion severity levels"""
    CLEAR = 1
    LIGHT = 2
    MODERATE = 3
    HEAVY = 4
    SEVERE = 5


class AlertType(str, Enum):
    """Alert types"""
    CONGESTION = "congestion"
    INCIDENT = "incident"
    WEATHER = "weather"
    PREDICTION = "prediction"


class Severity(str, Enum):
    """Alert severity"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Traffic Data Schemas
class TrafficDataCreate(BaseModel):
    """Create traffic data record"""
    location_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    congestion_level: Optional[int] = Field(None, ge=1, le=5)
    average_speed: Optional[float] = Field(None, ge=0)
    vehicle_count: Optional[int] = Field(None, ge=0)
    incident_reported: int = Field(0, ge=0, le=1)
    temperature: Optional[float] = None
    precipitation: Optional[float] = Field(None, ge=0)
    visibility: Optional[float] = Field(None, ge=0)
    weather_condition: Optional[str] = None
    timestamp: datetime
    event_nearby: int = Field(0, ge=0, le=1)
    event_type: Optional[str] = None
    data_source: str = "api"
    raw_data: Optional[Dict[str, Any]] = None


class TrafficDataResponse(BaseModel):
    """Traffic data response"""
    id: int
    location_id: str
    latitude: float
    longitude: float
    congestion_level: Optional[int]
    average_speed: Optional[float]
    vehicle_count: Optional[int]
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


# Prediction Schemas
class PredictionRequest(BaseModel):
    """Request traffic prediction"""
    location_id: str
    forecast_hours: List[int] = Field([1, 3, 6, 12, 24], description="Hours to forecast")
    include_features: bool = Field(False, description="Include feature importance")


class PredictionResponse(BaseModel):
    """Prediction response"""
    location_id: str
    location_name: Optional[str]
    prediction_time: datetime
    forecasts: List[Dict[str, Any]]
    model_type: str
    model_version: str
    
    class Config:
        from_attributes = True


# User Schemas
class UserCreate(BaseModel):
    """Create user account"""
    user_id: str
    email: str
    phone: Optional[str] = None
    fcm_token: Optional[str] = None
    preferred_locations: Optional[List[str]] = []
    alert_threshold: int = Field(3, ge=1, le=5)


class UserUpdate(BaseModel):
    """Update user preferences"""
    email: Optional[str] = None
    phone: Optional[str] = None
    fcm_token: Optional[str] = None
    push_enabled: Optional[int] = None
    email_enabled: Optional[int] = None
    sms_enabled: Optional[int] = None
    whatsapp_enabled: Optional[int] = None
    preferred_locations: Optional[List[str]] = None
    alert_threshold: Optional[int] = Field(None, ge=1, le=5)
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23)
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23)


class UserResponse(BaseModel):
    """User response"""
    id: int
    user_id: str
    email: str
    phone: Optional[str]
    push_enabled: int
    email_enabled: int
    sms_enabled: int
    whatsapp_enabled: int
    preferred_locations: Optional[List[str]]
    alert_threshold: int
    is_active: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Alert Schemas
class AlertCreate(BaseModel):
    """Create alert"""
    user_id: str
    location_id: str
    alert_type: AlertType
    severity: Severity
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)


class AlertResponse(BaseModel):
    """Alert response"""
    id: int
    user_id: str
    location_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    sent_push: int
    sent_email: int
    sent_sms: int
    sent_whatsapp: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Location Schemas
class LocationCreate(BaseModel):
    """Create location"""
    location_id: str
    name: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    city: Optional[str] = None
    area: Optional[str] = None
    road_type: Optional[str] = None


class LocationResponse(BaseModel):
    """Location response"""
    id: int
    location_id: str
    name: str
    latitude: float
    longitude: float
    city: Optional[str]
    area: Optional[str]
    road_type: Optional[str]
    is_active: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# AI Insights Schema
class AIInsightRequest(BaseModel):
    """Request AI-powered traffic insights"""
    location_id: str
    context: Optional[str] = Field(None, description="Additional context for analysis")
    include_recommendations: bool = Field(True, description="Include route recommendations")


class AIInsightResponse(BaseModel):
    """AI-generated traffic insights"""
    location_id: str
    analysis: str
    recommendations: Optional[List[str]]
    timestamp: datetime
