import axios from 'axios';
import logger from '../utils/logger';

interface TrafficSituation {
  locationId: string;
  currentCongestion: string;
  vehicleCount: number;
  averageSpeed: number;
  timestamp: Date;
}

interface AIAnalysisResult {
  analysis: string;
  recommendations: string[];
  severity: string;
}

export class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.FEATHERLESS_API_KEY || '';
    this.baseURL = 'https://api.featherless.ai/v1';
  }

  async analyzeTrafficSituation(situation: TrafficSituation): Promise<AIAnalysisResult> {
    try {
      const prompt = `Analyze this traffic situation and provide recommendations:
Location: ${situation.locationId}
Current Congestion: ${situation.currentCongestion}
Vehicle Count: ${situation.vehicleCount}
Average Speed: ${situation.averageSpeed} km/h
Time: ${situation.timestamp.toISOString()}

Provide:
1. Brief analysis of the situation
2. 3-5 actionable recommendations for drivers
3. Severity assessment (low/moderate/high/critical)`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
          messages: [
            { role: 'system', content: 'You are a traffic analysis expert providing concise, actionable advice.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse AI response (simplified)
      const lines = aiResponse.split('\n').filter((l: string) => l.trim());
      
      return {
        analysis: lines[0] || 'Traffic analysis completed',
        recommendations: lines.slice(1, 4),
        severity: this.extractSeverity(aiResponse, situation.averageSpeed),
      };
    } catch (error) {
      logger.error('AI analysis error:', error);
      
      // Fallback to rule-based analysis
      return this.fallbackAnalysis(situation);
    }
  }

  async getRouteRecommendations(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    currentTrafficData: any[]
  ): Promise<string[]> {
    try {
      const prompt = `Given traffic data between origin (${origin.lat}, ${origin.lon}) and destination (${destination.lat}, ${destination.lon}), provide 3 alternative route recommendations considering:
- Current congestion levels
- Typical travel times
- Road conditions

Keep recommendations brief and actionable.`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
          messages: [
            { role: 'system', content: 'You are a navigation assistant providing optimal route suggestions.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.6,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return aiResponse.split('\n').filter((l: string) => l.trim()).slice(0, 3);
    } catch (error) {
      logger.error('Route recommendation error:', error);
      return [
        'Use main highway route (fastest)',
        'Consider alternate route via residential areas',
        'Wait 15-30 minutes for traffic to clear',
      ];
    }
  }

  private extractSeverity(text: string, speed: number): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('critical') || lowerText.includes('severe')) return 'critical';
    if (lowerText.includes('high') || speed < 15) return 'high';
    if (lowerText.includes('moderate') || speed < 30) return 'moderate';
    return 'low';
  }

  private fallbackAnalysis(situation: TrafficSituation): AIAnalysisResult {
    const { averageSpeed, vehicleCount } = situation;
    
    let analysis = '';
    let severity: string = 'low';
    const recommendations: string[] = [];

    if (averageSpeed < 10) {
      severity = 'critical';
      analysis = 'Severe congestion detected with very slow traffic movement';
      recommendations.push(
        'Avoid this route if possible',
        'Consider public transportation alternatives',
        'Allow extra 30-45 minutes for travel'
      );
    } else if (averageSpeed < 20) {
      severity = 'high';
      analysis = 'High congestion with significantly reduced speeds';
      recommendations.push(
        'Expect delays of 20-30 minutes',
        'Use alternate routes if available',
        'Consider departure time adjustment'
      );
    } else if (averageSpeed < 35) {
      severity = 'moderate';
      analysis = 'Moderate traffic with some slowdowns';
      recommendations.push(
        'Normal precautions advised',
        'Monitor traffic updates',
        'Expect minor delays'
      );
    } else {
      severity = 'low';
      analysis = 'Traffic flowing smoothly';
      recommendations.push(
        'Good time to travel',
        'Maintain safe following distance',
        'No significant delays expected'
      );
    }

    return { analysis, recommendations, severity };
  }
}

export default new AIService();
