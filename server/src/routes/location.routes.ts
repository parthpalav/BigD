import { Router, Request, Response } from 'express';
import locationRepo from '../repositories/location.repository';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/locations
 * Get all active locations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const locations = await locationRepo.findAll();

    res.json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    logger.error('Location fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

/**
 * POST /api/v1/locations
 * Create a new location
 */
router.post(
  '/',
  [
    body('name').isString(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('city').optional().isString(),
    body('state').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, latitude, longitude, city, state } = req.body;

      const location = await locationRepo.create({ name, latitude, longitude, city, state });

      res.status(201).json({ success: true, data: location });
    } catch (error) {
      logger.error('Location creation error:', error);
      res.status(500).json({ error: 'Failed to create location' });
    }
  }
);

/**
 * GET /api/v1/locations/:id
 * Get location by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await locationRepo.findById(id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ success: true, data: location });
  } catch (error) {
    logger.error('Location fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

export default router;
