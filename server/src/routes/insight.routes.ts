import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import trafficDataRepo from '../repositories/trafficData.repository';
import aiService from '../services/ai.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/insights/analyze
 * Get AI-powered traffic analysis
 */
router.get(
  '/analyze',
  [query('locationId').isUUID()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { locationId } = req.query;

      // Get latest traffic data
      const latestDataArray = await trafficDataRepo.find(locationId as string, undefined, undefined, 1);

      if (latestDataArray.length === 0) {
        return res.status(404).json({ error: 'No traffic data found for this location' });
      }

      const latestData = latestDataArray[0];

      const analysis = await aiService.analyzeTrafficSituation({
        locationId: locationId as string,
        currentCongestion: latestData.congestionLevel,
        vehicleCount: latestData.vehicleCount,
        averageSpeed: latestData.averageSpeed,
        timestamp: latestData.timestamp,
      });

      res.json({
        success: true,
        data: {
          ...analysis,
          currentData: {
            congestionLevel: latestData.congestionLevel,
            vehicleCount: latestData.vehicleCount,
            averageSpeed: latestData.averageSpeed,
            timestamp: latestData.timestamp,
          },
        },
      });
    } catch (error) {
      logger.error('Insight analysis error:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  }
);

/**
 * GET /api/v1/insights/routes
 * Get route recommendations
 */
router.get(
  '/routes',
  [
    query('originLat').isFloat(),
    query('originLon').isFloat(),
    query('destLat').isFloat(),
    query('destLon').isFloat(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { originLat, originLon, destLat, destLon } = req.query;

      const recommendations = await aiService.getRouteRecommendations(
        { lat: parseFloat(originLat as string), lon: parseFloat(originLon as string) },
        { lat: parseFloat(destLat as string), lon: parseFloat(destLon as string) },
        []
      );

      res.json({ success: true, data: { recommendations } });
    } catch (error) {
      logger.error('Route recommendations error:', error);
      res.status(500).json({ error: 'Failed to generate route recommendations' });
    }
  }
);

export default router;
