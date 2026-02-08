import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

class TrafficPredictionModel:
    """ML model for traffic congestion prediction"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'hour', 'day_of_week', 'is_weekend', 'is_rush_hour',
            'lat', 'lon', 'free_flow_speed', 'historical_avg_congestion'
        ]
        
    def create_features(self, df: np.ndarray) -> np.ndarray:
        """
        Create feature engineering for traffic prediction
        
        Args:
            df: Array with traffic data
        
        Returns:
            Array with engineered features
        """
        features = df.copy()
        
        # Time-based features already included in synthetic data
        return features
    
    def generate_synthetic_training_data(self, n_samples: int = 10000) -> np.ndarray:
        """
        Generate synthetic training data based on traffic patterns
        This is used when historical TomTom data is not available
        
        Args:
            n_samples: Number of samples to generate
        
        Returns:
            Array with synthetic traffic data [features, labels]
        """
        np.random.seed(42)
        
        X = []
        y = []
        
        for _ in range(n_samples):
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)
            lat = 37.0 + np.random.random() * 1.0  # SF Bay Area
            lon = -122.5 + np.random.random() * 1.0
            free_flow_speed = 50 + np.random.random() * 30  # 50-80 km/h
            is_weekend = int(day_of_week in [5, 6])
            is_rush_hour = int(hour in [7, 8, 9, 17, 18, 19])
            
            # Base congestion by time of day
            if 7 <= hour <= 9:  # Morning rush
                base_congestion = 60 + np.random.random() * 30
            elif 17 <= hour <= 19:  # Evening rush
                base_congestion = 65 + np.random.random() * 30
            elif 11 <= hour <= 14:  # Midday
                base_congestion = 35 + np.random.random() * 25
            elif hour >= 22 or hour <= 5:  # Night
                base_congestion = 5 + np.random.random() * 20
            else:  # Other times
                base_congestion = 25 + np.random.random() * 25
            
            # Adjust for weekends (less congestion)
            if is_weekend:
                base_congestion *= 0.7
            
            # Historical average
            historical_avg = base_congestion
            
            # Add noise
            congestion = np.clip(base_congestion + np.random.randn() * 5, 0, 100)
            
            X.append([hour, day_of_week, is_weekend, is_rush_hour, lat, lon, free_flow_speed, historical_avg])
            y.append(congestion)
        
        return np.array(X), np.array(y)
    
    def train(self, X: np.ndarray, y: np.ndarray):
        """
        Train the traffic prediction model
        
        Args:
            X: Training features
            y: Training labels (congestion)
        """
        print(f"Training model with {len(X)} samples...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train ensemble model (Random Forest + Gradient Boosting)
        print("Training Random Forest model...")
        rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=10,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train_scaled, y_train)
        
        print("Training Gradient Boosting model...")
        gb_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        gb_model.fit(X_train_scaled, y_train)
        
        # Ensemble: average predictions
        rf_pred = rf_model.predict(X_test_scaled)
        gb_pred = gb_model.predict(X_test_scaled)
        y_pred = (rf_pred + gb_pred) / 2
        
        # Evaluate
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\nModel Performance:")
        print(f"  MSE: {mse:.2f}")
        print(f"  R² Score: {r2:.4f}")
        print(f"  RMSE: {np.sqrt(mse):.2f}")
        
        # Store both models for ensemble prediction
        self.model = {
            'rf': rf_model,
            'gb': gb_model
        }
        
        return {
            'mse': mse,
            'r2': r2,
            'rmse': np.sqrt(mse)
        }
    
    def predict(
        self,
        hour: int,
        day_of_week: int,
        lat: float,
        lon: float,
        free_flow_speed: float = 60.0
    ) -> Dict:
        """
        Predict traffic congestion for given parameters
        
        Args:
            hour: Hour of day (0-23)
            day_of_week: Day of week (0=Monday, 6=Sunday)
            lat: Latitude
            lon: Longitude
            free_flow_speed: Free flow speed in km/h
        
        Returns:
            Dict with congestion prediction and confidence
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        
        # Create feature vector
        is_weekend = int(day_of_week in [5, 6])
        is_rush_hour = int(hour in [7, 8, 9, 17, 18, 19])
        
        # Use synthetic historical average for prediction
        if is_rush_hour:
            historical_avg = 70.0
        elif 11 <= hour <= 14:
            historical_avg = 40.0
        elif hour >= 22 or hour <= 5:
            historical_avg = 15.0
        else:
            historical_avg = 35.0
        
        if is_weekend:
            historical_avg *= 0.7
        
        features = np.array([[
            hour, day_of_week, is_weekend, is_rush_hour,
            lat, lon, free_flow_speed, historical_avg
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Ensemble prediction
        rf_pred = self.model['rf'].predict(features_scaled)[0]
        gb_pred = self.model['gb'].predict(features_scaled)[0]
        congestion = (rf_pred + gb_pred) / 2
        
        # Clip to valid range
        congestion = np.clip(congestion, 0, 100)
        
        # Calculate confidence based on model agreement
        prediction_variance = abs(rf_pred - gb_pred)
        confidence = max(70, min(95, 95 - prediction_variance))
        
        # Calculate speed and duration
        speed_reduction = (congestion / 100) * 0.6
        current_speed = free_flow_speed * (1 - speed_reduction)
        
        return {
            'congestion': float(congestion),
            'confidence': float(confidence),
            'current_speed': float(current_speed),
            'free_flow_speed': float(free_flow_speed),
            'speed_reduction_percent': float(speed_reduction * 100)
        }
    
    def save(self, path: str = './models'):
        """Save the trained model"""
        os.makedirs(path, exist_ok=True)
        
        if self.model is None:
            raise ValueError("No model to save. Train the model first.")
        
        joblib.dump(self.model, os.path.join(path, 'traffic_model.pkl'))
        joblib.dump(self.scaler, os.path.join(path, 'scaler.pkl'))
        print(f"Model saved to {path}")
    
    def load(self, path: str = './models'):
        """Load a trained model"""
        self.model = joblib.load(os.path.join(path, 'traffic_model.pkl'))
        self.scaler = joblib.load(os.path.join(path, 'scaler.pkl'))
        print(f"Model loaded from {path}")


if __name__ == "__main__":
    print("=== Training Traffic Prediction ML Model ===\n")
    
    # Initialize model
    model = TrafficPredictionModel()
    
    # Generate synthetic training data
    print("Generating synthetic training data...")
    X, y = model.generate_synthetic_training_data(n_samples=10000)
    print(f"Generated {len(X)} training samples\n")
    
    # Train model
    metrics = model.train(X, y)
    
    # Save model
    model.save()
    print("\n=== Training Complete ===")
    
    # Test predictions
    print("\n=== Testing Predictions ===")
    test_cases = [
        (8, 1, 37.7749, -122.4194, "Morning rush hour, weekday"),
        (18, 1, 37.7749, -122.4194, "Evening rush hour, weekday"),
        (14, 1, 37.7749, -122.4194, "Midday, weekday"),
        (2, 1, 37.7749, -122.4194, "Night, weekday"),
        (8, 6, 37.7749, -122.4194, "Morning rush hour, weekend"),
    ]
    
    for hour, day, lat, lon, description in test_cases:
        pred = model.predict(hour, day, lat, lon)
        print(f"\n{description}:")
        print(f"  Hour: {hour}:00, Day: {day}")
        print(f"  Predicted Congestion: {pred['congestion']:.1f}%")
        print(f"  Confidence: {pred['confidence']:.1f}%")
        print(f"  Current Speed: {pred['current_speed']:.1f} km/h")
