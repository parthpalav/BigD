# ORION Traffic Intelligence - ML Service

Machine Learning service for traffic congestion prediction using TomTom Traffic API.

## Features

- **Traffic Prediction ML Model**: Random Forest + Gradient Boosting ensemble
- **TomTom API Integration**: Real-time traffic data collection
- **Feature Engineering**: Time-based patterns, cyclical encoding, historical averages
- **RESTful API**: Flask-based prediction endpoints

## Setup

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your TomTom API key:

```bash
cp .env.example .env
```

Get your TomTom API key from: https://developer.tomtom.com/

### 3. Train Model

```bash
python traffic_model.py
```

This will:
- Generate synthetic training data (10,000 samples)
- Train Random Forest + Gradient Boosting models
- Save trained model to `./models/`

### 4. Run ML Service

```bash
python app.py
```

Service will run on `http://localhost:5000`

## API Endpoints

### Health Check
```bash
GET /health
```

### Predict Congestion
```bash
POST /predict
Content-Type: application/json

{
  "hour": 8,
  "day_of_week": 1,
  "lat": 37.7749,
  "lon": -122.4194,
  "free_flow_speed": 60
}
```

Response:
```json
{
  "success": true,
  "prediction": {
    "congestion": 75.3,
    "confidence": 87.2,
    "current_speed": 45.6,
    "free_flow_speed": 60.0,
    "speed_reduction_percent": 24.0
  }
}
```

### Predict Route
```bash
POST /predict-route
Content-Type: application/json

{
  "coordinates": [[37.7749, -122.4194], [37.3382, -121.8863]],
  "hour": 8,
  "day_of_week": 1
}
```

### Get TomTom Traffic Data
```bash
POST /tomtom/traffic
Content-Type: application/json

{
  "lat": 37.7749,
  "lon": -122.4194
}
```

### Retrain Model
```bash
POST /retrain
Content-Type: application/json

{
  "n_samples": 10000
}
```

## Model Details

### Architecture
- **Ensemble Model**: Random Forest (100 trees) + Gradient Boosting (100 estimators)
- **Features**: hour, day_of_week, is_weekend, is_rush_hour, lat, lon, free_flow_speed, historical_avg_congestion
- **Output**: Congestion level (0-100%)

### Training Data
Currently uses synthetic data based on traffic patterns. For production:
1. Collect real TomTom historical data over time
2. Store data in database
3. Retrain model periodically with real data

### Performance
- **R² Score**: ~0.95 (on synthetic data)
- **RMSE**: ~5-8% congestion level

## Integration with Express Backend

Add to `server/src/routes/ml.ts`:

```typescript
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

export const predictTraffic = async (req, res) => {
  const { hour, day_of_week, lat, lon } = req.body;
  
  const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
    hour, day_of_week, lat, lon
  });
  
  res.json(response.data);
};
```

## Production Deployment

### Option 1: Run alongside Express
```bash
# Start ML service
cd ml-service && python app.py &

# Start Express server
cd server && npm run dev
```

### Option 2: Separate Container
```dockerfile
# Dockerfile for ML service
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

### Option 3: Cloud Function
Deploy as AWS Lambda, Google Cloud Function, or Azure Function

## TomTom Traffic API

### Free Tier
- 2,500 requests/day
- Real-time traffic flow data

### Required Data
- Traffic Flow API: Current speed, free flow speed, travel time
- Historical Traffic Data: Past patterns (separate product)

## Future Enhancements

1. **LSTM/Time Series Model**: Better temporal predictions
2. **Real Historical Data**: Collect and store actual TomTom data
3. **Weather Integration**: Add weather impact features
4. **Event Detection**: Special events causing traffic
5. **Route Optimization**: Multi-objective optimization (time + fuel)
