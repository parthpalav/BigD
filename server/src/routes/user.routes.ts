import { Router, Request, Response } from 'express';
import userRepo from '../repositories/user.repository';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/users/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').isString(),
    body('phoneNumber').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create user (password hashing is done in repository)
      const user = await userRepo.create({ email, password, fullName, phoneNumber });

      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

/**
 * POST /api/v1/users/login
 * Login user
 */
router.post(
  '/login',
  [body('email').isEmail(), body('password').isString()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await userRepo.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

/**
 * PATCH /api/v1/users/:id/fcm-token
 * Update user's FCM token for push notifications
 */
router.patch(
  '/:id/fcm-token',
  [body('fcmToken').isString()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { fcmToken } = req.body;

      await userRepo.updateFcmToken(id, fcmToken);

      res.json({ success: true, message: 'FCM token updated' });
    } catch (error) {
      logger.error('FCM token update error:', error);
      res.status(500).json({ error: 'Failed to update FCM token' });
    }
  }
);

export default router;
