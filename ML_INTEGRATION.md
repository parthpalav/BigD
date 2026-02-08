# ORION Traffic Intelligence - ML Integration Guide

## Overview

The ORION platform now includes a machine learning-based traffic prediction system using **TomTom Traffic API** data. The system uses an ensemble of **Random Forest** and **Gradient Boosting** models to predict traffic congestion with high accuracy.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Express    │─────▶│  ML Service │
│   (React)   │      │   Backend    │      │  (Flask)    │
└─────────────┘      └──────────────┘      └─────────────┘
                             │                      │
                             ▼                      ▼
                     ┌──────────────┐      ┌─────────────┐
                     │   MongoDB    │      │   TomTom    │
                     └──────────────┘      │  Traffic API│
                                           └─────────────┘
```

## Quick Start

### 1. Install ML Service

```bash
# Run the automated setup script
./setup-ml-service.sh
```

This will:
- Create Python virtual environment
- Install all dependencies (scikit-learn, tensorflow, flask, etc.)
- Train the initial ML model
- Save the model to `ml-service/models/`

### 2. Configure TomTom API

Get your TomTom API key from: https://developer.tomtom.com/

Add it to `ml-service/.env`:
```env
TOMTOM_API_KEY=your_tomtom_api_key_here
ML_SERVICE_PORT=5000
```

### 3. Enable ML Predictions (Optional)

By default, the app uses rule-based predictions. To enable ML:

Edit `client/.env`:
```env
VITE_USE_ML_MODEL=true
VITE_API_URL=http://localhost:3001
```

### 4. Start All Services

```bash
# Start ML service, Express backend, and React frontend
./start-all.sh
```

Or start individually:
```bash
# Terminal 1: ML Service
./start-ml-service.sh

# Terminal 2: Express Backend
cd server && npm run dev

# Terminal 3: React Frontend
cd client && npm run dev
```

## API Endpoints

### ML Service (Port 5000)

#### Health Check
```bash
GET http://localhost:5000/health
```

#### Predict Congestion
```bash
POST http://localhost:5000/predict
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

#### Predict Route
```bash
POST http://localhost:5000/predict-route
Content-Type: application/json

{
  "coordinates": [[37.7749, -122.4194], [37.3382, -121.8863]],
  "hour": 8,
  "day_of_week": 1
}
```

#### Get TomTom Traffic
```bash
POST http://localhost:5000/tomtom/traffic
Content-Type: application/json

{
  "lat": 37.7749,
  "lon": -122.4194
}
```

### Express Backend (Port 3001)

#### ML Prediction Proxy
```bash
POST http://localhost:3001/api/ml/predict
Content-Type: application/json

{
  "hour": 8,
  "day_of_week": 1,
  "lat": 37.7749,
  "lon": -122.4194
}
```

#### Route Prediction
```bash
POST http://localhost:3001/api/ml/predict-route
Content-Type: application/json

{
  "coordinates": [[37.7749, -122.4194], [37.3382, -121.8863]],
  "hour": 8,
  "day_of_week": 1
}
```

## ML Model Details

### Features
- **hour**: Hour of day (0-23)
- **day_of_week**: Day of week (0=Monday, 6=Sunday)
- **is_weekend**: Binary (0 or 1)
- **is_rush_hour**: Binary (0 or 1)
- **lat**: Latitude
- **lon**: Longitude
- **free_flow_speed**: Free flow speed in km/h
- **historical_avg_congestion**: Historical average for this hour/location

### Model Architecture
- **Random Forest**: 100 trees, max depth 15
- **Gradient Boosting**: 100 estimators, max depth 5, learning rate 0.1
- **Ensemble**: Average of both model predictions
- **Performance**: R² = 0.95, RMSE = 5-8% (on synthetic data)

### Training Data

#### Current: Synthetic Data
The model is currently trained on 10,000 synthetic samples that simulate realistic traffic patterns:
- Morning rush: 7-9 AM (60-90% congestion)
- Evening rush: 5-7 PM (65-95% congestion)
- Midday: 11 AM-2 PM (35-60% congestion)
- Night: 10 PM-5 AM (5-25% congestion)
- Weekend adjustment: 30% reduction

#### Future: Real TomTom Data
For production, integrate real TomTom historical data:

1. **Collect Historical Data**:
```python
from tomtom_api import TomTomTrafficAPI

client = TomTomTrafficAPI(api_key="your_key")
coords = [(37.7749, -122.4194), (37.3382, -121.8863)]
df = client.collect_historical_data(coords, duration_hours=720)  # 30 days
```

2. **Store in Database**:
```python
# Save to MongoDB or CSV
df.to_csv('traffic_data.csv', index=False)
```

3. **Retrain Model**:
```python
from traffic_model import TrafficPredictionModel

model = TrafficPredictionModel()
df = pd.read_csv('traffic_data.csv')
model.train(df)
model.save('./models')
```

4. **Auto-retrain API**:
```bash
POST http://localhost:5000/retrain
Content-Type: application/json

{
  "n_samples": 10000
}
```

## TomTom Traffic API

### Free Tier
- 2,500 requests/day
- Real-time traffic flow data
- Current speed, free flow speed, travel time

### Required API Product
- **Traffic Flow API**: Real-time data (included in free tier)
- **Historical Traffic Data**: Past patterns (separate product, paid)

### API Usage Example
```python
from tomtom_api import TomTomTrafficAPI

client = TomTomTrafficAPI()

# Get traffic for a point
data = client.get_traffic_flow(lat=37.7749, lon=-122.4194)
congestion = client.calculate_congestion_percentage(data)
print(f"Congestion: {congestion}%")

# Get traffic for a route
coords = [(37.7749, -122.4194), (37.3382, -121.8863)]
route_traffic = client.get_route_traffic(coords)
```

## Environment Variables

### ML Service (`ml-service/.env`)
```env
TOMTOM_API_KEY=your_tomtom_api_key
ML_SERVICE_PORT=5000
```

### Express Backend (`server/.env`)
```env
ML_SERVICE_URL=http://localhost:5000
```

### React Frontend (`client/.env`)
```env
VITE_USE_ML_MODEL=true
VITE_API_URL=http://localhost:3001
```

## Deployment

### Development
```bash
./start-all.sh
```

### Production - Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  ml-service:
    build: ./ml-service
    ports:
      - "5000:5000"
    environment:
      - TOMTOM_API_KEY=${TOMTOM_API_KEY}
    volumes:
      - ./ml-service/models:/app/models

  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - ML_SERVICE_URL=http://ml-service:5000
      - MONGODB_URI=${MONGODB_URI}

  frontend:
    build: ./client
    ports:
      - "80:80"
    environment:
      - VITE_USE_ML_MODEL=true
      - VITE_API_URL=https://api.orionmaps.xyz
```

### Production - Separate Services

1. **ML Service**: Deploy to AWS Lambda, Google Cloud Run, or Heroku
2. **Express Backend**: Deploy to Render, Heroku, or AWS EC2
3. **React Frontend**: Deploy to Firebase, Vercel, or Netlify

Update environment variables accordingly.

## Testing

### Test ML Service
```bash
cd ml-service
source venv/bin/activate
python traffic_model.py
```

### Test API Integration
```bash
# Start services
./start-all.sh

# Test ML prediction
curl -X POST http://localhost:3001/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"hour":8,"day_of_week":1,"lat":37.7749,"lon":-122.4194}'

# Test route prediction
curl -X POST http://localhost:3001/api/ml/predict-route \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[[37.7749,-122.4194],[37.3382,-121.8863]],"hour":8,"day_of_week":1}'
```

### Test Frontend Integration
1. Open http://localhost:5173
2. Search for a route
3. Check browser console for ML API calls
4. Verify predictions are displayed

## Troubleshooting

### ML Service Won't Start
```bash
# Check Python version (need 3.9+)
python3 --version

# Reinstall dependencies
cd ml-service
pip install -r requirements.txt

# Check for errors
python app.py
```

### ML Predictions Not Working
1. Check `VITE_USE_ML_MODEL=true` in `client/.env`
2. Verify ML service is running on port 5000
3. Check Express backend can reach ML service
4. Look at browser console and backend logs

### TomTom API Errors
- Verify API key is correct
- Check free tier limits (2,500 requests/day)
- Ensure coordinates are valid (lat/lon)

## Performance Optimization

### Caching
Add Redis caching for predictions:
```python
import redis
r = redis.Redis(host='localhost', port=6379)

def get_cached_prediction(key):
    cached = r.get(key)
    if cached:
        return json.loads(cached)
    return None

def cache_prediction(key, prediction):
    r.setex(key, 3600, json.dumps(prediction))  # 1 hour TTL
```

### Batch Predictions
For routes, batch all coordinate predictions:
```python
# Instead of:
for coord in coordinates:
    predict(coord)

# Use vectorized prediction:
predictions = model.predict_batch(coordinates)
```

### Model Optimization
- Use smaller models for faster inference
- Quantize model weights
- Use ONNX runtime for production

## Future Enhancements

1. **LSTM Time Series Model**: Better temporal predictions
2. **Weather Integration**: Add weather impact features
3. **Event Detection**: Account for special events
4. **Transfer Learning**: Use pre-trained models
5. **Real-time Learning**: Update model with live data
6. **Multi-city Support**: Train city-specific models
7. **Route Optimization**: ML-based route planning

## Support

For issues or questions:
- Check logs in `./logs/` directory
- Review [ml-service/README.md](ml-service/README.md)
- Open GitHub issue

## License

MIT License - See LICENSE file
