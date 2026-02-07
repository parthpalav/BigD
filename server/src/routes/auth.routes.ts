import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import userRepo from '../repositories/user.repository';
import { config } from '../config';
import logger from '../utils/logger';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/auth/google/callback'
);

// Generate JWT token
const generateToken = (user: { id: string; email: string; fullName: string; role?: string }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role || 'user',
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
};

/**
 * POST /api/v1/auth/register
 * Register a new user with email/password
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').isString().trim().isLength({ min: 1 }),
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
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Create user (password hashing is done in repository)
      const user = await userRepo.create({ email, password, fullName, phoneNumber });

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        fullName: user.fullName || 'User',
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName || 'User',
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login with email/password
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await userRepo.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await userRepo.updateLastLogin(user.id);

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        fullName: user.fullName || 'User',
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            lastLogin: new Date().toISOString(),
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

/**
 * POST /api/v1/auth/google
 * Authenticate with Google OAuth
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ error: 'Google credential or access token is required' });
    }

    let payload: { email?: string; name?: string; picture?: string; sub?: string } | undefined;

    try {
      // Verify the credential token from Google
      if (credential) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else if (access_token) {
        // Alternatively, verify access token
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
        );
        const data = await response.json();
        payload = data as { email?: string; name?: string; picture?: string; sub?: string };
      }

      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'Invalid Google credentials' });
      }

      const { email, name, picture, sub: googleId } = payload;

      // Check if user exists
      let user = await userRepo.findByEmail(email);

      if (!user) {
        // Create new user with Google account
        user = await userRepo.create({
          email,
          password: '', // No password for OAuth users
          fullName: name || email.split('@')[0],
          phoneNumber: '',
          googleId,
          profilePicture: picture,
        }) as any;
        logger.info(`New user created via Google OAuth: ${email}`);
      } else {
        // Update last login
        await userRepo.updateLastLogin(user.id);
      }

      if (!user) {
        return res.status(500).json({ error: 'Failed to create or fetch user' });
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        fullName: user.fullName || 'User',
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture || picture,
            lastLogin: new Date().toISOString(),
          },
          token,
        },
      });
    } catch (verifyError: any) {
      logger.error('Google token verification failed:', verifyError);
      return res.status(401).json({ error: 'Invalid Google token', details: verifyError.message });
    }
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await userRepo.findById(authReq.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  authenticate,
  [
    body('fullName').optional().isString().trim(),
    body('phoneNumber').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
      if (!authReq.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, phoneNumber } = req.body;
      const updates: any = {};

      if (fullName) updates.fullName = fullName;
      if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

      const updatedUser = await userRepo.update(authReq.user.id, updates);

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          phoneNumber: updatedUser.phoneNumber,
          profilePicture: updatedUser.profilePicture,
        },
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout (client should remove token)
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
