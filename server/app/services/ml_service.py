"""
Machine Learning Service
Handles XGBoost and LSTM model predictions for traffic forecasting
"""
import xgboost as xgb
import numpy as np
import pandas as pd
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import joblib
import os

from app.core.config import settings
from app.core.cache import get_cache, set_cache

logger = logging.getLogger(__name__)


class MLService:
    """ML model management and prediction service"""
    
    def __init__(self):
        self.xgboost_model = None
        self.lstm_model = None
        self.feature_columns = None
        self.model_metadata = {}
    
    async def load_models(self):
        """Load pre-trained ML models"""
        try:
            # Load XGBoost model
            if os.path.exists(settings.XGBOOST_MODEL_PATH):
                self.xgboost_model = xgb.Booster()
                self.xgboost_model.load_model(settings.XGBOOST_MODEL_PATH)
                logger.info("XGBoost model loaded successfully")
                self.model_metadata['xgboost'] = {
                    'loaded': True,
                    'version': '1.0',
                    'type': 'gradient_boosting'
                }
            else:
                logger.warning(f"XGBoost model not found at {settings.XGBOOST_MODEL_PATH}")
            
            # Load LSTM model (TensorFlow/Keras)
            if os.path.exists(settings.LSTM_MODEL_PATH):
                try:
                    from tensorflow import keras
                    self.lstm_model = keras.models.load_model(settings.LSTM_MODEL_PATH)
                    logger.info("LSTM model loaded successfully")
                    self.model_metadata['lstm'] = {
                        'loaded': True,
                        'version': '1.0',
                        'type': 'deep_learning'
                    }
                except Exception as e:
                    logger.error(f"LSTM model loading failed: {e}")
            else:
                logger.warning(f"LSTM model not found at {settings.LSTM_MODEL_PATH}")
            
            # Define feature columns expected by models
            self.feature_columns = [
                'hour_of_day', 'day_of_week', 'is_weekend', 'is_holiday',
                'temperature', 'precipitation', 'visibility',
                'vehicle_count', 'average_speed', 'incident_reported',
                'event_nearby', 'congestion_lag_1h', 'congestion_lag_3h',
                'congestion_lag_24h', 'speed_lag_1h'
            ]
            
        except Exception as e:
            logger.error(f"Model loading error: {e}")
            raise
    
    def prepare_features(self, data: Dict[str, Any], historical_data: Optional[pd.DataFrame] = None) -> np.ndarray:
        """
        Prepare feature vector for prediction
        
        Args:
            data: Current traffic and weather data
            historical_data: Historical data for lag features
        
        Returns:
            Feature array ready for prediction
        """
        features = {}
        
        # Time features
        timestamp = data.get('timestamp', datetime.utcnow())
        features['hour_of_day'] = timestamp.hour
        features['day_of_week'] = timestamp.weekday()
        features['is_weekend'] = 1 if timestamp.weekday() >= 5 else 0
        features['is_holiday'] = data.get('is_holiday', 0)
        
        # Weather features
        features['temperature'] = data.get('temperature', 20.0)
        features['precipitation'] = data.get('precipitation', 0.0)
        features['visibility'] = data.get('visibility', 10.0)
        
        # Traffic features
        features['vehicle_count'] = data.get('vehicle_count', 100)
        features['average_speed'] = data.get('average_speed', 40.0)
        features['incident_reported'] = data.get('incident_reported', 0)
        features['event_nearby'] = data.get('event_nearby', 0)
        
        # Lag features (from historical data or defaults)
        if historical_data is not None and len(historical_data) > 0:
            features['congestion_lag_1h'] = historical_data.iloc[-1].get('congestion_level', 2)
            features['congestion_lag_3h'] = historical_data.iloc[-3].get('congestion_level', 2) if len(historical_data) >= 3 else 2
            features['congestion_lag_24h'] = historical_data.iloc[-24].get('congestion_level', 2) if len(historical_data) >= 24 else 2
            features['speed_lag_1h'] = historical_data.iloc[-1].get('average_speed', 40.0)
        else:
            # Default values when no historical data
            features['congestion_lag_1h'] = data.get('congestion_level', 2)
            features['congestion_lag_3h'] = 2
            features['congestion_lag_24h'] = 2
            features['speed_lag_1h'] = data.get('average_speed', 40.0)
        
        # Convert to array in correct order
        feature_array = np.array([[features[col] for col in self.feature_columns]])
        
        return feature_array
    
    async def predict_congestion_xgboost(
        self,
        location_id: str,
        current_data: Dict[str, Any],
        forecast_hours: List[int],
        historical_data: Optional[pd.DataFrame] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate traffic predictions using XGBoost
        
        Args:
            location_id: Location identifier
            current_data: Current traffic/weather conditions
            forecast_hours: List of hours to forecast (e.g., [1, 3, 6, 12, 24])
            historical_data: Historical data for lag features
        
        Returns:
            List of predictions for each forecast horizon
        """
        if not self.xgboost_model:
            raise ValueError("XGBoost model not loaded")
        
        # Check cache
        cache_key = f"prediction:xgb:{location_id}:{datetime.utcnow().strftime('%Y%m%d%H')}"
        cached = await get_cache(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return cached
        
        predictions = []
        
        for hours_ahead in forecast_hours:
            try:
                # Adjust timestamp for forecast
                forecast_time = datetime.utcnow() + timedelta(hours=hours_ahead)
                forecast_data = current_data.copy()
                forecast_data['timestamp'] = forecast_time
                
                # Prepare features
                features = self.prepare_features(forecast_data, historical_data)
                
                # Create DMatrix for XGBoost
                dmatrix = xgb.DMatrix(features, feature_names=self.feature_columns)
                
                # Make prediction
                prediction = self.xgboost_model.predict(dmatrix)[0]
                
                # Calculate confidence score (simplified)
                confidence = 0.85 - (hours_ahead * 0.02)  # Decreases with forecast horizon
                confidence = max(0.5, min(0.95, confidence))
                
                predictions.append({
                    'forecast_hours': hours_ahead,
                    'target_time': forecast_time.isoformat(),
                    'predicted_congestion': round(float(prediction), 2),
                    'congestion_level': int(round(prediction)),
                    'confidence': round(confidence, 2),
                    'model': 'xgboost'
                })
                
            except Exception as e:
                logger.error(f"Prediction error for {hours_ahead}h: {e}")
                continue
        
        # Cache results
        if predictions:
            await set_cache(cache_key, predictions, ttl=1800)  # 30 minutes
        
        return predictions
    
    async def predict_congestion_lstm(
        self,
        location_id: str,
        sequence_data: np.ndarray,
        forecast_hours: List[int]
    ) -> List[Dict[str, Any]]:
        """
        Generate traffic predictions using LSTM
        
        Args:
            location_id: Location identifier
            sequence_data: Time-series sequence data
            forecast_hours: List of hours to forecast
        
        Returns:
            List of predictions
        """
        if not self.lstm_model:
            raise ValueError("LSTM model not loaded")
        
        predictions = []
        
        try:
            # LSTM expects 3D input: (batch_size, timesteps, features)
            if len(sequence_data.shape) == 2:
                sequence_data = np.expand_dims(sequence_data, axis=0)
            
            # Make predictions
            lstm_predictions = self.lstm_model.predict(sequence_data, verbose=0)
            
            for idx, hours_ahead in enumerate(forecast_hours):
                if idx < len(lstm_predictions[0]):
                    forecast_time = datetime.utcnow() + timedelta(hours=hours_ahead)
                    prediction_value = float(lstm_predictions[0][idx])
                    
                    predictions.append({
                        'forecast_hours': hours_ahead,
                        'target_time': forecast_time.isoformat(),
                        'predicted_congestion': round(prediction_value, 2),
                        'congestion_level': int(round(prediction_value)),
                        'confidence': 0.80,
                        'model': 'lstm'
                    })
        
        except Exception as e:
            logger.error(f"LSTM prediction error: {e}")
        
        return predictions
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from XGBoost model"""
        if not self.xgboost_model:
            return {}
        
        try:
            importance = self.xgboost_model.get_score(importance_type='gain')
            # Normalize
            total = sum(importance.values())
            return {k: round(v/total, 4) for k, v in importance.items()}
        except Exception as e:
            logger.error(f"Feature importance error: {e}")
            return {}
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            'models': self.model_metadata,
            'features': self.feature_columns,
            'feature_count': len(self.feature_columns) if self.feature_columns else 0
        }
