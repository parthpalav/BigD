import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import mlService from '../services/ml.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/predictions
 * Get traffic predictions for a location
 */
router.get(
  '/',
  [
    query('locationId').isUUID(),
    query('predictionTime').optional().isISO8601(),
    query('horizon').optional().isInt({ min: 1, max: 24 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { locationId, predictionTime, horizon = 6 } = req.query;
      const targetTime = predictionTime ? new Date(predictionTime as string) : new Date();

      const predictions = await mlService.predictCongestion(
        locationId as string,
        targetTime,
        horizon as number
      );

      res.json({
        success: true,
        locationId,
        predictionTime: targetTime,
        horizon,
        predictions,
      });
    } catch (error) {
      logger.error('Prediction error:', error);
      res.status(500).json({ error: 'Failed to generate predictions' });
    }
  }
);

export default router;
