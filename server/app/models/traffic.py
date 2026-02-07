"""
Traffic Data Model
Stores GPS data, traffic sensor readings, weather, and city events
"""
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Index
from sqlalchemy.sql import func
from datetime import datetime

from app.core.database import Base


class TrafficData(Base):
    """Traffic data from multiple sources"""
    __tablename__ = "traffic_data"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Traffic metrics
    congestion_level = Column(Integer)  # 1-5 scale
    average_speed = Column(Float)  # km/h
    vehicle_count = Column(Integer)
    incident_reported = Column(Integer, default=0)  # 0=no, 1=yes
    
    # Weather data
    temperature = Column(Float)  # Celsius
    precipitation = Column(Float)  # mm
    visibility = Column(Float)  # km
    weather_condition = Column(String(50))
    
    # Time features
    timestamp = Column(DateTime, nullable=False, index=True)
    hour_of_day = Column(Integer)
    day_of_week = Column(Integer)
    is_weekend = Column(Integer)
    is_holiday = Column(Integer, default=0)
    
    # City events
    event_nearby = Column(Integer, default=0)
    event_type = Column(String(100))
    
    # Metadata
    data_source = Column(String(50))  # GPS, sensor, etc.
    raw_data = Column(JSON)  # Store complete raw data
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_location_time', 'location_id', 'timestamp'),
        Index('idx_congestion', 'congestion_level'),
    )


class TrafficPrediction(Base):
    """ML model predictions"""
    __tablename__ = "traffic_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Prediction details
    prediction_time = Column(DateTime, nullable=False)  # When prediction was made
    target_time = Column(DateTime, nullable=False, index=True)  # Time being predicted
    forecast_horizon = Column(Integer)  # Hours ahead (1, 3, 6, 12, 24)
    
    # Predicted values
    predicted_congestion = Column(Float, nullable=False)
    predicted_speed = Column(Float)
    confidence_score = Column(Float)  # 0-1
    
    # Model info
    model_type = Column(String(50))  # xgboost, lstm
    model_version = Column(String(50))
    
    # Features used
    features = Column(JSON)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    
    __table_args__ = (
        Index('idx_location_target', 'location_id', 'target_time'),
    )


class User(Base):
    """User accounts for notifications"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(20))
    
    # Notification preferences
    fcm_token = Column(String(500))  # Firebase Cloud Messaging
    push_enabled = Column(Integer, default=1)
    email_enabled = Column(Integer, default=1)
    sms_enabled = Column(Integer, default=0)
    whatsapp_enabled = Column(Integer, default=0)
    
    # User preferences
    preferred_locations = Column(JSON)  # Array of location IDs
    alert_threshold = Column(Integer, default=3)  # Congestion level 1-5
    quiet_hours_start = Column(Integer)  # Hour 0-23
    quiet_hours_end = Column(Integer)
    
    # Metadata
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=func.now())


class Alert(Base):
    """Traffic alerts sent to users"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    location_id = Column(String(100), nullable=False)
    
    # Alert details
    alert_type = Column(String(50))  # congestion, incident, weather
    severity = Column(String(20))  # low, medium, high, critical
    title = Column(String(200))
    message = Column(String(1000))
    
    # Delivery channels
    sent_push = Column(Integer, default=0)
    sent_email = Column(Integer, default=0)
    sent_sms = Column(Integer, default=0)
    sent_whatsapp = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default='pending')  # pending, sent, failed
    delivered_at = Column(DateTime)
    read_at = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
    )


class Location(Base):
    """Monitored traffic locations"""
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    
    # Geographic data
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(100))
    area = Column(String(100))
    road_type = Column(String(50))  # highway, arterial, local
    
    # Metadata
    is_active = Column(Integer, default=1)
    sensor_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=func.now())
