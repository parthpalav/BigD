#!/bin/bash

echo "==================================="
echo "ORION Traffic Intelligence ML Setup"
echo "==================================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Navigate to ml-service directory
cd ml-service || exit 1

# Create virtual environment
echo "📦 Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please add your TomTom API key to ml-service/.env"
fi

# Train the model
echo ""
echo "🤖 Training ML model..."
python traffic_model.py

echo ""
echo "==================================="
echo "✅ ML Service Setup Complete!"
echo "==================================="
echo ""
echo "To start the ML service:"
echo "  cd ml-service"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "Or use the start script:"
echo "  ./start-ml-service.sh"
echo ""
