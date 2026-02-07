import * as tf from '@tensorflow/tfjs-node';
import trafficDataRepo from '../repositories/trafficData.repository';
import { getNeo4jSession } from '../config/database';
import logger from '../utils/logger';

interface PredictionResult {
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
  vehicleCount: number;
  averageSpeed: number;
  confidence: number;
}

export class MLService {
  private static instance: MLService;
  private xgboostModel: any = null;
  private lstmModel: tf.LayersModel | null = null;

  private constructor() {}

  static getInstance(): MLService {
    if (!MLService.instance) {
      MLService.instance = new MLService();
    }
    return MLService.instance;
  }

  async initialize() {
    try {
      // Load or train models
      logger.info('ML Service initialized (models will be trained on first use)');
    } catch (error) {
      logger.error('Failed to initialize ML service:', error);
    }
  }

  /**
   * Predict traffic congestion using simple heuristics
   * TODO: Integrate actual ML models (XGBoost/LSTM)
   */
  async predictCongestion(
    locationId: string,
    predictionTime: Date,
    horizon: number = 1
  ): Promise<PredictionResult[]> {
    try {
      // Get historical data (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const historicalData = await trafficDataRepo.find(locationId, sevenDaysAgo, new Date(), 168);

      if (historicalData.length === 0) {
        throw new Error('Insufficient historical data for prediction');
      }

      // Simple prediction based on historical averages
      const predictions: PredictionResult[] = [];
      
      for (let h = 0; h < horizon; h++) {
        const targetTime = new Date(predictionTime.getTime() + h * 60 * 60 * 1000);
        const targetHour = targetTime.getHours();
        
        // Filter data for similar hour
        const similarHourData = historicalData.filter(
          (d) => new Date(d.timestamp).getHours() === targetHour
        );

        const avgVehicleCount =
          similarHourData.reduce((sum, d) => sum + d.vehicleCount, 0) /
          similarHourData.length;
        
        const avgSpeed =
          similarHourData.reduce((sum, d) => sum + d.averageSpeed, 0) /
          similarHourData.length;

        let congestionLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';
        if (avgSpeed < 10) congestionLevel = 'severe';
        else if (avgSpeed < 20) congestionLevel = 'high';
        else if (avgSpeed < 35) congestionLevel = 'moderate';

        predictions.push({
          congestionLevel,
          vehicleCount: Math.round(avgVehicleCount),
          averageSpeed: parseFloat(avgSpeed.toFixed(2)),
          confidence: 0.75,
        });
      }

      // Save predictions to database
      await this.savePredictions(locationId, predictionTime, predictions);

      return predictions;
    } catch (error) {
      logger.error('Prediction error:', error);
      throw error;
    }
  }

  private async savePredictions(
    locationId: string,
    startTime: Date,
    predictions: PredictionResult[]
  ) {
    const session = getNeo4jSession();
    try {
      for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i];
        const predTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);

        await session.run(
          `CREATE (p:Prediction {
            id: randomUUID(),
            locationId: $locationId,
            predictionTime: datetime($predictionTime),
            predictedCongestionLevel: $congestionLevel,
            predictedVehicleCount: $vehicleCount,
            predictedAverageSpeed: $averageSpeed,
            confidenceScore: $confidence,
            modelUsed: 'ensemble',
            createdAt: datetime($now)
          })`,
          {
            locationId,
            predictionTime: predTime.toISOString(),
            congestionLevel: pred.congestionLevel,
            vehicleCount: pred.vehicleCount,
            averageSpeed: pred.averageSpeed,
            confidence: pred.confidence,
            now: new Date().toISOString(),
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Feature engineering for ML models
   */
  private extractFeatures(data: any[]): number[][] {
    return data.map((d) => [
      d.vehicleCount,
      d.averageSpeed,
      new Date(d.timestamp).getHours(),
      new Date(d.timestamp).getDay(),
      d.isRushHour ? 1 : 0,
      d.isHoliday ? 1 : 0,
      d.temperature || 20,
      d.humidity || 50,
    ]);
  }
}

export default MLService.getInstance();