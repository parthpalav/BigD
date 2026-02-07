import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import userRepo from '../repositories/user.repository';
import notificationService from '../services/notification.service';
import logger from '../utils/logger';
import { getNeo4jSession } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/v1/alerts
 * Get alerts for a user
 */
router.get(
  '/',
  [query('userId').isUUID(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, limit = 50 } = req.query;
      const session = getNeo4jSession();

      try {
        const result = await session.run(
          `MATCH (a:Alert {userId: $userId})
           RETURN a
           ORDER BY a.createdAt DESC
           LIMIT $limit`,
          { userId: userId as string, limit: limit as number }
        );

        const alerts = result.records.map((record) => {
          const props = record.get('a').properties;
          return {
            id: props.id,
            userId: props.userId,
            alertType: props.alertType,
            message: props.message,
            severityLevel: props.severityLevel,
            locationId: props.locationId,
            status: props.status,
            sentVia: props.sentVia || [],
            createdAt: new Date(props.createdAt),
          };
        });

        res.json({ success: true, count: alerts.length, data: alerts });
      } finally {
        await session.close();
      }
    } catch (error) {
      logger.error('Alert fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }
);

/**
 * POST /api/v1/alerts
 * Create and send an alert
 */
router.post(
  '/',
  [
    body('userId').isUUID(),
    body('alertType').isIn(['congestion', 'incident', 'route_change', 'weather']),
    body('message').isString(),
    body('severityLevel').isIn(['low', 'moderate', 'high', 'critical']),
    body('locationId').optional().isUUID(),
    body('channels').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, alertType, message, severityLevel, locationId, channels } = req.body;
      const session = getNeo4jSession();

      try {
        const id = uuidv4();
        const createdAt = new Date();
        let status = 'pending';
        let sentVia: string[] = [];

        // Send notifications if channels specified
        if (channels && channels.length > 0) {
          const user = await userRepo.findByEmail(userId);
          if (user) {
            const results = await notificationService.sendMultiChannelAlert(
              {
                email: user.email,
                phoneNumber: user.phoneNumber || undefined,
                fcmToken: user.fcmToken || undefined,
              },
              {
                recipient: user.email,
                message,
                title: `Traffic Alert: ${alertType}`,
              },
              channels
            );

            sentVia = results.filter((r) => r.success).map((r) => r.channel);
            status = sentVia.length > 0 ? 'sent' : 'failed';
          }
        }

        // Create alert in Neo4j
        const result = await session.run(
          `CREATE (a:Alert {
            id: $id,
            userId: $userId,
            alertType: $alertType,
            message: $message,
            severityLevel: $severityLevel,
            locationId: $locationId,
            status: $status,
            sentVia: $sentVia,
            createdAt: datetime($createdAt)
          })
          RETURN a`,
          { id, userId, alertType, message, severityLevel, locationId, status, sentVia, createdAt: createdAt.toISOString() }
        );

        const alert = {
          id,
          userId,
          alertType,
          message,
          severityLevel,
          locationId,
          status,
          sentVia,
          createdAt,
        };

        res.status(201).json({ success: true, data: alert });
      } finally {
        await session.close();
      }
    } catch (error) {
      logger.error('Alert creation error:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  }
);

export default router;
