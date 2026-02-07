"""
Application Configuration
Centralized settings management using Pydantic
"""
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Urban Traffic Congestion API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    SECRET_KEY: str
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600
    
    # ML Models
    MODEL_PATH: str = "./models/"
    XGBOOST_MODEL_PATH: str = "./models/xgboost_traffic_model.json"
    LSTM_MODEL_PATH: str = "./models/lstm_traffic_model.h5"
    PREDICTION_BATCH_SIZE: int = 100
    
    # Featherless.ai
    FEATHERLESS_API_KEY: str
    FEATHERLESS_API_URL: str = "https://api.featherless.ai/v1"
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "./config/firebase-credentials.json"
    FIREBASE_PROJECT_ID: str
    
    # Twilio
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str
    TWILIO_WHATSAPP_NUMBER: str
    
    # Email
    SENDGRID_API_KEY: str
    EMAIL_FROM: str = "noreply@trafficpwa.com"
    EMAIL_FROM_NAME: str = "Traffic Alert System"
    
    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # mParivahan (Future)
    MPARIVAHAN_API_URL: str = "https://api.mparivahan.gov.in"
    MPARIVAHAN_API_KEY: str = ""
    
    # Monitoring
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
