#!/bin/bash

echo "==================================="
echo "Starting ORION Traffic Intelligence"
echo "==================================="
echo ""

# Kill any existing processes on required ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start ML service in background
echo "🤖 Starting ML service on port 5000..."
cd ml-service
source venv/bin/activate 2>/dev/null || {
    echo "⚠️  ML service not set up. Run ./setup-ml-service.sh first"
    echo "   Continuing without ML service..."
}
python app.py > ../logs/ml-service.log 2>&1 &
ML_PID=$!
cd ..

sleep 3

# Start Express backend
echo "🚀 Starting Express backend on port 3001..."
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
cd ..

sleep 2

# Start Vite frontend
echo "⚡ Starting Vite frontend on port 5173..."
cd client
npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
cd ..

echo ""
echo "==================================="
echo "✅ All services started!"
echo "==================================="
echo ""
echo "Services:"
echo "  🤖 ML Service:  http://localhost:5000"
echo "  🚀 Backend API: http://localhost:3001"
echo "  ⚡ Frontend:    http://localhost:5173"
echo ""
echo "Process IDs:"
echo "  ML: $ML_PID"
echo "  Server: $SERVER_PID"
echo "  Client: $CLIENT_PID"
echo ""
echo "Logs directory: ./logs/"
echo ""
echo "To stop all services:"
echo "  killall node python"
echo "  or use Ctrl+C"
echo ""

# Create logs directory
mkdir -p logs

# Wait for user interrupt
wait
