import { Router, Request, Response } from 'express';
import trafficDataRepo from '../repositories/trafficData.repository';
import { body, query, validationResult } from 'express-validator';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/traffic
 * Get traffic data with filtering
 */
router.get(
  '/',
  [
    query('locationId').optional().isUUID(),
    query('startTime').optional().isISO8601(),
    query('endTime').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { locationId, startTime, endTime, limit = 100 } = req.query;

      const trafficData = await trafficDataRepo.find(
        locationId as string | undefined,
        startTime ? new Date(startTime as string) : undefined,
        endTime ? new Date(endTime as string) : undefined,
        limit as number
      );

      res.json({
        success: true,
        count: trafficData.length,
        data: trafficData,
      });
    } catch (error) {
      logger.error('Traffic data fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch traffic data' });
    }
  }
);

/**
 * POST /api/v1/traffic
 * Create new traffic data entry
 */
router.post(
  '/',
  [
    body('locationId').isUUID(),
    body('vehicleCount').isInt({ min: 0 }),
    body('averageSpeed').isFloat({ min: 0 }),
    body('congestionLevel').isIn(['low', 'moderate', 'high', 'severe']),
    body('timestamp').optional().isISO8601(),
    body('temperature').optional().isFloat(),
    body('humidity').optional().isFloat(),
    body('weatherCondition').optional().isString(),
    body('isHoliday').optional().isBoolean(),
    body('isRushHour').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trafficData = await trafficDataRepo.create({
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });

      res.status(201).json({
        success: true,
        data: trafficData,
      });
    } catch (error) {
      logger.error('Traffic data creation error:', error);
      res.status(500).json({ error: 'Failed to create traffic data' });
    }
  }
);

/**
 * GET /api/v1/traffic/stats
 * Get traffic statistics for a location
 */
router.get(
  '/stats',
  [query('locationId').isUUID(), query('hours').optional().isInt({ min: 1, max: 168 }).toInt()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { locationId, hours = 24 } = req.query;

      const stats = await trafficDataRepo.getStats(locationId as string, hours as number);

      res.json({ success: true, stats });
    } catch (error) {
      logger.error('Traffic stats error:', error);
      res.status(500).json({ error: 'Failed to fetch traffic statistics' });
    }
  }
);

export default router;
