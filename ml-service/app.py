from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from traffic_model import TrafficPredictionModel
from tomtom_api import TomTomTrafficAPI
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load trained model
model = TrafficPredictionModel()
tomtom_client = TomTomTrafficAPI()

# Try to load existing model, otherwise train a new one
try:
    model.load('./ml-service/models')
    print("Loaded existing model")
except:
    print("No existing model found. Training new model...")
    X, y = model.generate_synthetic_training_data(n_samples=10000)
    model.train(X, y)
    model.save('./ml-service/models')
    print("Model trained and saved")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': model.model is not None})

@app.route('/predict', methods=['POST'])
def predict_congestion():
    """
    Predict traffic congestion
    
    Request body:
    {
        "hour": 8,
        "day_of_week": 1,  // 0=Monday, 6=Sunday
        "lat": 37.7749,
        "lon": -122.4194,
        "free_flow_speed": 60  // optional, defaults to 60 km/h
    }
    
    Response:
    {
        "congestion": 75.3,
        "confidence": 87.2,
        "current_speed": 45.6,
        "free_flow_speed": 60.0,
        "speed_reduction_percent": 24.0
    }
    """
    try:
        data = request.json
        
        hour = data.get('hour')
        day_of_week = data.get('day_of_week')
        lat = data.get('lat')
        lon = data.get('lon')
        free_flow_speed = data.get('free_flow_speed', 60.0)
        
        # Validate inputs
        if hour is None or day_of_week is None or lat is None or lon is None:
            return jsonify({
                'error': 'Missing required fields: hour, day_of_week, lat, lon'
            }), 400
        
        # Make prediction
        prediction = model.predict(hour, day_of_week, lat, lon, free_flow_speed)
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/predict-route', methods=['POST'])
def predict_route():
    """
    Predict congestion for multiple points along a route
    
    Request body:
    {
        "coordinates": [[37.7749, -122.4194], [37.3382, -121.8863]],
        "hour": 8,
        "day_of_week": 1
    }
    
    Response:
    {
        "segments": [
            {"lat": 37.7749, "lon": -122.4194, "congestion": 75.3, ...},
            ...
        ],
        "avg_congestion": 68.5,
        "total_duration": 85.3
    }
    """
    try:
        data = request.json
        
        coordinates = data.get('coordinates', [])
        hour = data.get('hour')
        day_of_week = data.get('day_of_week')
        
        if not coordinates or hour is None or day_of_week is None:
            return jsonify({
                'error': 'Missing required fields: coordinates, hour, day_of_week'
            }), 400
        
        segments = []
        total_congestion = 0
        
        for coord in coordinates:
            lat, lon = coord[0], coord[1]
            prediction = model.predict(hour, day_of_week, lat, lon)
            
            segments.append({
                'lat': lat,
                'lon': lon,
                **prediction
            })
            total_congestion += prediction['congestion']
        
        avg_congestion = total_congestion / len(segments) if segments else 0
        
        return jsonify({
            'success': True,
            'segments': segments,
            'avg_congestion': avg_congestion,
            'num_segments': len(segments),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/tomtom/traffic', methods=['POST'])
def get_tomtom_traffic():
    """
    Get real-time traffic data from TomTom API
    
    Request body:
    {
        "lat": 37.7749,
        "lon": -122.4194
    }
    """
    try:
        data = request.json
        lat = data.get('lat')
        lon = data.get('lon')
        
        if lat is None or lon is None:
            return jsonify({
                'error': 'Missing required fields: lat, lon'
            }), 400
        
        traffic_data = tomtom_client.get_traffic_flow(lat, lon)
        
        if not traffic_data:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch TomTom data'
            }), 500
        
        congestion = tomtom_client.calculate_congestion_percentage(traffic_data)
        
        return jsonify({
            'success': True,
            'traffic_data': traffic_data,
            'congestion': congestion,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """
    Retrain the model with new data
    
    Request body:
    {
        "n_samples": 10000  // optional
    }
    """
    try:
        data = request.json or {}
        n_samples = data.get('n_samples', 10000)
        
        print(f"Retraining model with {n_samples} samples...")
        df = model.generate_synthetic_training_data(n_samples=n_samples)
        metrics = model.train(df)
        model.save('./models')
        
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'metrics': metrics
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_SERVICE_PORT', 5001))
    print(f"Starting ML service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
