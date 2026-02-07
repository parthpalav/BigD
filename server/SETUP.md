# Urban Traffic Congestion PWA - Backend System

## Quick Start Guide

### Prerequisites
- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized deployment)

### Setup Steps

1. **Install Dependencies**
```bash
cd server
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your API keys and credentials
```

3. **Start Database Services**
```bash
# Option 1: Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=traffic_pass -e POSTGRES_USER=traffic_user -e POSTGRES_DB=traffic_db postgres:15-alpine
docker run -d -p 6379:6379 redis:7-alpine

# Option 2: Using Docker Compose (recommended)
docker-compose up -d
```

4. **Run the Application**
```bash
# Development
uvicorn main:app --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

5. **Access API Documentation**
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Project Structure

```
server/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker image configuration
├── docker-compose.yml     # Multi-container setup
├── .env.example          # Environment variables template
├── README.md             # Detailed documentation
│
├── app/
│   ├── core/             # Core configurations
│   │   ├── config.py     # Settings management
│   │   ├── database.py   # Database connection
│   │   └── cache.py      # Redis caching
│   │
│   ├── models/           # SQLAlchemy models
│   │   └── traffic.py    # Traffic, User, Alert models
│   │
│   ├── schemas/          # Pydantic schemas
│   │   └── traffic.py    # Request/response schemas
│   │
│   ├── services/         # Business logic
│   │   ├── ml_service.py         # XGBoost/LSTM predictions
│   │   ├── ai_service.py         # Featherless.ai integration
│   │   └── notification_service.py # Multi-channel alerts
│   │
│   ├── api/              # API routes
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── traffic.py      # Traffic data endpoints
│   │           ├── predictions.py  # ML predictions
│   │           ├── users.py        # User management
│   │           ├── alerts.py       # Alert system
│   │           ├── locations.py    # Location management
│   │           └── insights.py     # AI insights
│   │
│   └── tasks/            # Celery background tasks
│       ├── celery_app.py
│       └── scheduled_tasks.py
│
├── models/               # ML model files (to be added)
│   ├── xgboost_traffic_model.json
│   └── lstm_traffic_model.h5
│
└── config/              # Configuration files
    └── firebase-credentials.json (to be added)
```

## Key Features Implemented

### ✅ 1. Traffic Data Management
- Ingest data from multiple sources (GPS, sensors, weather)
- Batch and real-time data processing
- Historical data retrieval
- Geographic search capabilities

### ✅ 2. ML-Powered Predictions
- XGBoost gradient boosting models
- LSTM deep learning models
- Multi-horizon forecasting (1-24 hours)
- Feature importance analysis
- Redis caching for performance

### ✅ 3. Multi-Channel Notifications
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: SendGrid integration
- **SMS**: Twilio
- **WhatsApp**: Twilio Business API
- User preference management
- Broadcast alerts to location subscribers

### ✅ 4. AI-Powered Insights
- Featherless.ai integration for traffic analysis
- Route recommendations
- City-wide traffic summaries
- Natural language insights

### ✅ 5. User Management
- Account creation and preferences
- Location monitoring subscriptions
- Alert threshold customization
- Quiet hours (do-not-disturb)

### ✅ 6. Background Processing
- Celery task queue
- Scheduled predictions (hourly)
- Automated alert checking
- Data cleanup tasks

### ✅ 7. Production Ready
- Docker containerization
- Docker Compose multi-service setup
- Health checks
- Error handling and logging
- Database migrations support
- API documentation

## API Endpoints Overview

### Traffic Data (`/api/v1/traffic`)
- `POST /` - Ingest single record
- `POST /batch` - Batch ingestion
- `GET /{location_id}/latest` - Current traffic
- `GET /{location_id}/history` - Historical data
- `GET /{location_id}/stats` - Statistics
- `GET /area/current` - Area search

### Predictions (`/api/v1/predictions`)
- `POST /{location_id}` - Generate predictions
- `GET /{location_id}/latest` - Latest predictions
- `GET /model/info` - Model information
- `GET /model/features` - Feature importance

### Users (`/api/v1/users`)
- `POST /` - Create account
- `GET /{user_id}` - Get user
- `PATCH /{user_id}` - Update preferences
- `POST /{user_id}/locations/{location_id}` - Add monitored location

### Alerts (`/api/v1/alerts`)
- `POST /` - Create alert
- `GET /user/{user_id}` - User alerts
- `POST /broadcast/{location_id}` - Broadcast alert
- `PATCH /{alert_id}/read` - Mark as read

### Locations (`/api/v1/locations`)
- `POST /` - Register location
- `GET /` - List locations
- `GET /search/nearby` - Search nearby

### AI Insights (`/api/v1/insights`)
- `POST /{location_id}` - Get AI analysis
- `GET /route/recommendations` - Route suggestions
- `GET /analysis/summary` - City summary

## Environment Configuration

Required environment variables (see `.env.example`):

```env
# Core
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key

# ML Models
MODEL_PATH=./models/
XGBOOST_MODEL_PATH=./models/xgboost_traffic_model.json
LSTM_MODEL_PATH=./models/lstm_traffic_model.h5

# Featherless.ai
FEATHERLESS_API_KEY=your-api-key

# Firebase
FIREBASE_CREDENTIALS_PATH=./config/firebase-credentials.json

# Twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

# SendGrid
SENDGRID_API_KEY=your-key
```

## Next Steps

1. **Train ML Models**: Create and train XGBoost/LSTM models, save to `models/` directory
2. **Setup Firebase**: Create project and add credentials to `config/`
3. **Configure Services**: Add API keys for Twilio, SendGrid, Featherless.ai
4. **Populate Locations**: Register traffic monitoring locations
5. **Start Data Ingestion**: Begin collecting traffic data
6. **Deploy**: Use Docker Compose for production deployment
7. **Frontend Integration**: Connect with PWA client
8. **mParivahan Integration**: Add government API integration when available

## Support & Documentation

- Full documentation in `server/README.md`
- API docs at `/api/v1/docs` when running
- Health check at `/health`

## Architecture Highlights

- **Async/Await**: Full async support with asyncpg and aioredis
- **Type Safety**: Pydantic schemas for validation
- **Caching**: Redis for predictions and frequent queries
- **Scalability**: Horizontal scaling with load balancers
- **Monitoring**: Structured logging and health checks
- **Security**: Environment-based secrets, CORS configuration

Built for the Urban Traffic Congestion Forecasting System 🚦
