import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import logger from '../utils/logger';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role?: string;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role?: string;
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        id: string;
        email: string;
        fullName: string;
        role?: string;
      };

      req.user = decoded;
      next();
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret) as {
            id: string;
            email: string;
            fullName: string;
            role?: string;
          };
          req.user = decoded;
        } catch (jwtError) {
          // Token invalid but continue anyway
          logger.warn('Invalid token in optional auth:', jwtError);
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};
