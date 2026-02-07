"""
Featherless.ai Integration Service
AI-powered traffic insights and recommendations
"""
import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.config import settings
from app.core.cache import get_cache, set_cache

logger = logging.getLogger(__name__)


class FeatherlessAIService:
    """Featherless.ai API integration for traffic reasoning"""
    
    def __init__(self):
        self.api_key = settings.FEATHERLESS_API_KEY
        self.api_url = settings.FEATHERLESS_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def analyze_traffic_situation(
        self,
        location_name: str,
        current_congestion: int,
        predicted_congestion: List[Dict[str, Any]],
        historical_patterns: Optional[Dict[str, Any]] = None,
        weather_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze traffic situation and provide AI insights
        
        Args:
            location_name: Name of the location
            current_congestion: Current congestion level (1-5)
            predicted_congestion: List of predictions
            historical_patterns: Historical traffic patterns
            weather_data: Current weather conditions
        
        Returns:
            AI-generated analysis and recommendations
        """
        # Check cache
        cache_key = f"ai_insight:{location_name}:{datetime.utcnow().strftime('%Y%m%d%H')}"
        cached = await get_cache(cache_key)
        if cached:
            return cached
        
        # Build context for AI
        context = self._build_traffic_context(
            location_name,
            current_congestion,
            predicted_congestion,
            historical_patterns,
            weather_data
        )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": "gpt-4",  # or your preferred model
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert traffic analyst. Analyze traffic patterns and provide actionable insights for urban commuters and city planners."
                        },
                        {
                            "role": "user",
                            "content": context
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                }
                
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    analysis = result['choices'][0]['message']['content']
                    
                    insight_data = {
                        'location': location_name,
                        'analysis': analysis,
                        'timestamp': datetime.utcnow().isoformat(),
                        'current_congestion': current_congestion,
                        'predictions': predicted_congestion
                    }
                    
                    # Cache for 1 hour
                    await set_cache(cache_key, insight_data, ttl=3600)
                    
                    return insight_data
                else:
                    logger.error(f"Featherless API error: {response.status_code}")
                    return self._fallback_analysis(location_name, current_congestion, predicted_congestion)
        
        except Exception as e:
            logger.error(f"Featherless AI error: {e}")
            return self._fallback_analysis(location_name, current_congestion, predicted_congestion)
    
    async def get_route_recommendations(
        self,
        origin: str,
        destination: str,
        current_traffic: Dict[str, Any],
        predictions: Dict[str, Any]
    ) -> List[str]:
        """
        Generate AI-powered route recommendations
        
        Args:
            origin: Starting location
            destination: Destination
            current_traffic: Current traffic conditions
            predictions: Traffic predictions
        
        Returns:
            List of route recommendations
        """
        context = f"""
        Route Planning Context:
        - Origin: {origin}
        - Destination: {destination}
        - Current Traffic: {current_traffic}
        - Predicted Traffic: {predictions}
        
        Provide 3 specific route recommendations considering:
        1. Fastest route with current conditions
        2. Best route considering predicted congestion
        3. Alternative route avoiding heavy traffic
        
        Format each recommendation as a bullet point with clear reasoning.
        """
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": "gpt-4",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a navigation expert. Provide clear, actionable route recommendations."
                        },
                        {
                            "role": "user",
                            "content": context
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 400
                }
                
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    recommendations = result['choices'][0]['message']['content']
                    # Parse into list
                    return [line.strip() for line in recommendations.split('\n') if line.strip()]
                else:
                    return self._fallback_recommendations()
        
        except Exception as e:
            logger.error(f"Route recommendation error: {e}")
            return self._fallback_recommendations()
    
    def _build_traffic_context(
        self,
        location_name: str,
        current_congestion: int,
        predicted_congestion: List[Dict[str, Any]],
        historical_patterns: Optional[Dict[str, Any]],
        weather_data: Optional[Dict[str, Any]]
    ) -> str:
        """Build context string for AI analysis"""
        
        congestion_labels = {1: "Clear", 2: "Light", 3: "Moderate", 4: "Heavy", 5: "Severe"}
        
        context = f"""
        Traffic Analysis Request for {location_name}:
        
        Current Situation:
        - Congestion Level: {current_congestion}/5 ({congestion_labels.get(current_congestion, 'Unknown')})
        - Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
        
        Predicted Congestion (next 24 hours):
        """
        
        for pred in predicted_congestion[:5]:  # Show top 5
            hours = pred['forecast_hours']
            level = pred['congestion_level']
            context += f"\n- {hours}h ahead: Level {level}/5 ({congestion_labels.get(level, 'Unknown')}), Confidence: {pred['confidence']*100:.0f}%"
        
        if weather_data:
            context += f"\n\nWeather Conditions:\n- Temperature: {weather_data.get('temperature', 'N/A')}°C\n- Conditions: {weather_data.get('condition', 'Unknown')}"
        
        if historical_patterns:
            context += f"\n\nHistorical Pattern: {historical_patterns.get('pattern_description', 'No data')}"
        
        context += """
        
        Please provide:
        1. Brief analysis of the traffic situation
        2. Key factors contributing to current/predicted congestion
        3. Recommendations for commuters (best travel times, alternatives)
        4. Insights for traffic management
        
        Keep the response clear, actionable, and under 300 words.
        """
        
        return context
    
    def _fallback_analysis(
        self,
        location_name: str,
        current_congestion: int,
        predicted_congestion: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Fallback analysis when AI service unavailable"""
        
        congestion_labels = {1: "Clear", 2: "Light", 3: "Moderate", 4: "Heavy", 5: "Severe"}
        
        # Simple rule-based analysis
        if current_congestion >= 4:
            analysis = f"Heavy traffic detected at {location_name}. Consider alternative routes or delaying travel if possible."
        elif current_congestion >= 3:
            analysis = f"Moderate congestion at {location_name}. Expect some delays."
        else:
            analysis = f"Traffic is flowing well at {location_name}. Good time to travel."
        
        # Check predictions
        if predicted_congestion:
            max_future = max([p['congestion_level'] for p in predicted_congestion])
            if max_future >= 4:
                analysis += " Heavy congestion is predicted in the coming hours."
        
        return {
            'location': location_name,
            'analysis': analysis,
            'timestamp': datetime.utcnow().isoformat(),
            'current_congestion': current_congestion,
            'predictions': predicted_congestion,
            'source': 'fallback'
        }
    
    def _fallback_recommendations(self) -> List[str]:
        """Fallback recommendations"""
        return [
            "Check real-time traffic updates before departing",
            "Consider using public transportation during peak hours",
            "Plan your route with alternative options in mind"
        ]
