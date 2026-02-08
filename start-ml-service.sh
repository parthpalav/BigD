#!/bin/bash

echo "Starting ORION ML Service..."

cd ml-service || exit 1

# Activate virtual environment
source venv/bin/activate

# Start Flask app
python app.py
