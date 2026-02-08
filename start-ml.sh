#!/bin/bash

echo "🤖 Starting ORION ML Service..."

# Kill any existing process on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
sleep 1

cd "$(dirname "$0")/ml-service"

# Check if model exists
if [ ! -f "models/traffic_model.pkl" ]; then
    echo "📚 Training ML model (first time setup)..."
    PYTHONPATH=venv/lib/python3.12/site-packages python3 traffic_model.py
fi

# Start ML service
echo "🚀 Starting ML API on port 5001..."
PYTHONPATH=venv/lib/python3.12/site-packages python3 app.py &

ML_PID=$!
echo "✅ ML Service started (PID: $ML_PID)"
echo ""
echo "ML Service running at: http://localhost:5001"
echo "Health check: http://localhost:5001/health"
echo ""
echo "To stop: kill $ML_PID"

# Wait for service to be ready
sleep 2
curl -s http://localhost:5001/health && echo "" && echo "✅ ML Service is healthy!"
