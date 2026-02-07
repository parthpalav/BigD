# Urban Traffic Congestion Forecasting API

FastAPI-based backend system for ML-powered traffic prediction, multi-channel alerts, and AI-powered insights.

## 🚀 Features

- **ML Predictions**: XGBoost & LSTM models for traffic forecasting (1-24 hours ahead)
- **Multi-Source Data**: GPS, traffic sensors, weather, city events integration
- **AI Insights**: Featherless.ai powered traffic analysis & recommendations
- **Multi-Channel Alerts**: Push (Firebase), Email (SendGrid), SMS & WhatsApp (Twilio)
- **Real-Time Processing**: Redis caching & async operations
- **Scalable Architecture**: PostgreSQL, Celery background tasks, Docker deployment

## 📋 Prerequisites

- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for containerized deployment)

## 🛠️ Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (SQLAlchemy async)
- **Cache**: Redis
- **ML**: XGBoost, TensorFlow/Keras (LSTM)
- **AI**: Featherless.ai API
- **Notifications**: Firebase FCM, Twilio, SendGrid
- **Task Queue**: Celery
- **Deployment**: Docker

## 📦 Installation

### Local Development

1. **Clone the repository**
```bash
cd server
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

5. **Start services (PostgreSQL & Redis)**
```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=traffic_pass -e POSTGRES_USER=traffic_user -e POSTGRES_DB=traffic_db postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine
```

6. **Run application**
```bash
uvicorn main:app --reload
```

### Docker Deployment

1. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production credentials
```

2. **Build and start all services**
```bash
docker-compose up -d
```

3. **Check services status**
```bash
docker-compose ps
```

## 🔑 Configuration

### Required Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/traffic_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Featherless.ai
FEATHERLESS_API_KEY=your-api-key

# Firebase (Push Notifications)
FIREBASE_CREDENTIALS_PATH=./config/firebase-credentials.json
FIREBASE_PROJECT_ID=your-project-id

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@trafficpwa.com
```

### Firebase Setup

1. Create a Firebase project
2. Generate service account credentials
3. Save as `config/firebase-credentials.json`

## 📊 API Documentation

Once running, access interactive API docs:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

### Key Endpoints

#### Traffic Data
- `POST /api/v1/traffic/` - Ingest traffic data
- `POST /api/v1/traffic/batch` - Batch data ingestion
- `GET /api/v1/traffic/{location_id}/latest` - Get current traffic
- `GET /api/v1/traffic/{location_id}/history` - Historical data
- `GET /api/v1/traffic/{location_id}/stats` - Traffic statistics

#### Predictions
- `POST /api/v1/predictions/{location_id}` - Generate predictions
- `GET /api/v1/predictions/{location_id}/latest` - Get latest predictions
- `GET /api/v1/predictions/model/info` - Model information
- `GET /api/v1/predictions/model/features` - Feature importance

#### Users
- `POST /api/v1/users/` - Create user account
- `GET /api/v1/users/{user_id}` - Get user details
- `PATCH /api/v1/users/{user_id}` - Update preferences
- `POST /api/v1/users/{user_id}/locations/{location_id}` - Add monitored location

#### Alerts
- `POST /api/v1/alerts/` - Create alert
- `GET /api/v1/alerts/user/{user_id}` - Get user alerts
- `POST /api/v1/alerts/broadcast/{location_id}` - Broadcast to all users
- `PATCH /api/v1/alerts/{alert_id}/read` - Mark as read

#### Locations
- `POST /api/v1/locations/` - Register location
- `GET /api/v1/locations/` - List all locations
- `GET /api/v1/locations/search/nearby` - Find nearby locations

#### AI Insights
- `POST /api/v1/insights/{location_id}` - Get AI analysis
- `GET /api/v1/insights/route/recommendations` - Route suggestions
- `GET /api/v1/insights/analysis/summary` - City-wide summary

## 🧪 Example Usage

### Ingest Traffic Data
```bash
curl -X POST "http://localhost:8000/api/v1/traffic/" \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "main_st_5th_ave",
    "latitude": 40.7589,
    "longitude": -73.9851,
    "congestion_level": 3,
    "average_speed": 25.5,
    "vehicle_count": 150,
    "temperature": 22.0,
    "timestamp": "2026-02-07T10:00:00Z",
    "data_source": "gps"
  }'
```

### Get Traffic Prediction
```bash
curl -X POST "http://localhost:8000/api/v1/predictions/main_st_5th_ave" \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": "main_st_5th_ave",
    "forecast_hours": [1, 3, 6, 12, 24],
    "include_features": true
  }'
```

### Create User & Enable Alerts
```bash
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "email": "user@example.com",
    "phone": "+1234567890",
    "preferred_locations": ["main_st_5th_ave"],
    "alert_threshold": 3,
    "push_enabled": 1,
    "email_enabled": 1
  }'
```

## 🔧 ML Model Setup

### Prepare Models

Place your trained models in the `models/` directory:

- `models/xgboost_traffic_model.json` - XGBoost model
- `models/lstm_traffic_model.h5` - LSTM model (Keras format)

### Model Training (Example)

```python
import xgboost as xgb
import pandas as pd

# Load training data
data = pd.read_csv('traffic_training_data.csv')
X = data[feature_columns]
y = data['congestion_level']

# Train XGBoost
model = xgb.XGBRegressor(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1
)
model.fit(X, y)

# Save model
model.save_model('models/xgboost_traffic_model.json')
```

## 🚦 Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T10:00:00Z",
  "service": "Urban Traffic Congestion API",
  "version": "v1"
}
```

## 📈 Monitoring & Logs

### View Logs
```bash
# Docker
docker-compose logs -f api

# Local
tail -f logs/app.log
```

### Database Migrations
```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 🔒 Security

- Use strong `SECRET_KEY` in production
- Enable HTTPS/TLS
- Implement rate limiting
- Secure API keys in environment variables
- Use proper CORS configuration

## 🤝 Integration

### Future: mParivahan Integration

The system is prepared for mParivahan API integration:

```python
# app/services/mparivahan_service.py
MPARIVAHAN_API_URL = settings.MPARIVAHAN_API_URL
MPARIVAHAN_API_KEY = settings.MPARIVAHAN_API_KEY
```

## 📝 License

[Your License]

## 👥 Contributors

[Your Team]

## 📧 Support

For issues and questions, please open an issue on GitHub.
