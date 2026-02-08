import os
import requests
from datetime import datetime, timedelta
import pandas as pd
from typing import List, Dict, Tuple
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv('TOMTOM_API_KEY', '')

class TomTomTrafficAPI:
    """Client for TomTom Traffic Flow API"""
    
    BASE_URL = "https://api.tomtom.com/traffic/services/4"
    
    def __init__(self, api_key: str = TOMTOM_API_KEY):
        self.api_key = api_key
    
    def get_traffic_flow(
        self, 
        lat: float, 
        lon: float, 
        zoom: int = 10,
        style: str = "absolute"
    ) -> Dict:
        """
        Get real-time traffic flow data for a location
        
        Args:
            lat: Latitude
            lon: Longitude
            zoom: Zoom level (0-22)
            style: 'absolute' or 'relative'
        
        Returns:
            Traffic flow data including speed, free flow speed, current travel time
        """
        url = f"{self.BASE_URL}/flowSegmentData/{style}/{zoom}/json"
        params = {
            'point': f'{lat},{lon}',
            'key': self.api_key,
            'unit': 'KMPH'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching traffic data: {e}")
            return {}
    
    def get_route_traffic(
        self,
        coordinates: List[Tuple[float, float]],
        departure_time: datetime = None
    ) -> List[Dict]:
        """
        Get traffic data for multiple points along a route
        
        Args:
            coordinates: List of (lat, lon) tuples
            departure_time: Optional departure time for prediction
        
        Returns:
            List of traffic data for each coordinate
        """
        traffic_data = []
        
        for lat, lon in coordinates:
            data = self.get_traffic_flow(lat, lon)
            if data and 'flowSegmentData' in data:
                flow_data = data['flowSegmentData']
                traffic_data.append({
                    'lat': lat,
                    'lon': lon,
                    'currentSpeed': flow_data.get('currentSpeed', 0),
                    'freeFlowSpeed': flow_data.get('freeFlowSpeed', 0),
                    'currentTravelTime': flow_data.get('currentTravelTime', 0),
                    'freeFlowTravelTime': flow_data.get('freeFlowTravelTime', 0),
                    'confidence': flow_data.get('confidence', 0),
                    'timestamp': datetime.now().isoformat()
                })
        
        return traffic_data
    
    def calculate_congestion_percentage(self, traffic_data: Dict) -> float:
        """
        Calculate congestion percentage from traffic data
        
        Args:
            traffic_data: Traffic flow data from API
        
        Returns:
            Congestion percentage (0-100)
        """
        if 'flowSegmentData' not in traffic_data:
            return 0.0
        
        flow = traffic_data['flowSegmentData']
        current_speed = flow.get('currentSpeed', 0)
        free_flow_speed = flow.get('freeFlowSpeed', 1)
        
        if free_flow_speed == 0:
            return 0.0
        
        # Congestion = (1 - current_speed / free_flow_speed) * 100
        congestion = max(0, min(100, (1 - current_speed / free_flow_speed) * 100))
        return congestion
    
    def collect_historical_data(
        self,
        route_coordinates: List[Tuple[float, float]],
        duration_hours: int = 24,
        interval_minutes: int = 15
    ) -> pd.DataFrame:
        """
        Collect historical traffic data for training
        
        Args:
            route_coordinates: List of (lat, lon) tuples
            duration_hours: How many hours to collect data
            interval_minutes: Sampling interval
        
        Returns:
            DataFrame with historical traffic patterns
        """
        data_points = []
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=duration_hours)
        
        print(f"Collecting traffic data from {start_time} to {end_time}")
        print(f"Note: TomTom API provides real-time data only.")
        print("For historical data, you need TomTom Historical Traffic Data product.")
        
        # In production, you would:
        # 1. Use TomTom Historical Traffic Data API
        # 2. Or collect and store data over time
        # 3. Or use pre-existing datasets
        
        # For now, collect current data as a sample
        for lat, lon in route_coordinates:
            traffic_data = self.get_traffic_flow(lat, lon)
            if traffic_data and 'flowSegmentData' in traffic_data:
                flow = traffic_data['flowSegmentData']
                congestion = self.calculate_congestion_percentage(traffic_data)
                
                data_points.append({
                    'timestamp': datetime.now(),
                    'hour': datetime.now().hour,
                    'day_of_week': datetime.now().weekday(),
                    'lat': lat,
                    'lon': lon,
                    'current_speed': flow.get('currentSpeed', 0),
                    'free_flow_speed': flow.get('freeFlowSpeed', 0),
                    'congestion_level': congestion,
                    'travel_time': flow.get('currentTravelTime', 0)
                })
        
        return pd.DataFrame(data_points)


def sample_route_coordinates() -> List[Tuple[float, float]]:
    """Generate sample coordinates along a route for testing"""
    # Example: Route from San Francisco to San Jose
    return [
        (37.7749, -122.4194),  # San Francisco
        (37.7000, -122.4000),
        (37.6000, -122.3500),
        (37.5000, -122.3000),
        (37.4000, -122.2500),
        (37.3382, -121.8863)   # San Jose
    ]


if __name__ == "__main__":
    # Test the TomTom API client
    client = TomTomTrafficAPI()
    
    # Test single point
    print("Testing single point traffic data...")
    data = client.get_traffic_flow(37.7749, -122.4194)  # San Francisco
    if data:
        print(f"Traffic data: {data}")
        congestion = client.calculate_congestion_percentage(data)
        print(f"Congestion level: {congestion}%")
    
    # Test route traffic
    print("\nTesting route traffic data...")
    coords = sample_route_coordinates()
    route_traffic = client.get_route_traffic(coords)
    print(f"Collected {len(route_traffic)} data points along route")
    
    # Collect sample historical data
    print("\nCollecting sample data for training...")
    df = client.collect_historical_data(coords, duration_hours=1)
    print(f"\nCollected data:\n{df.head()}")
    print(f"\nData shape: {df.shape}")
