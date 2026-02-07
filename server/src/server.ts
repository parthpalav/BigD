import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import { initNeo4j, closeNeo4j } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';
import trafficRoutes from './routes/traffic.routes';
import predictionRoutes from './routes/prediction.routes';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import alertRoutes from './routes/alert.routes';
import locationRoutes from './routes/location.routes';
import insightRoutes from './routes/insight.routes';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

class Server {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(compression());

    // CORS configuration
    this.app.use(cors({
      origin: config.corsOrigins,
      credentials: true
    }));

    // Request logging
    this.app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv
      });
    });

    // API routes
    const apiPrefix = '/api/v1';
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/traffic`, trafficRoutes);
    this.app.use(`${apiPrefix}/predictions`, predictionRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/alerts`, alertRoutes);
    this.app.use(`${apiPrefix}/locations`, locationRoutes);
    this.app.use(`${apiPrefix}/insights`, insightRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Urban Traffic Congestion API',
        version: '1.0.0',
        docs: `${req.protocol}://${req.get('host')}/api/v1/docs`
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize Neo4j Database
      try {
        await initNeo4j();
        logger.info('✅ Neo4j connected successfully');
      } catch (dbError: any) {
        logger.error('⚠️  Neo4j connection failed:', dbError.message);
        logger.warn('💡 Please install Neo4j: brew install neo4j');
        logger.warn('💡 Or set NEO4J_URI in .env to a running Neo4j instance');
        logger.warn('💡 Default: bolt://localhost:7687 (user: neo4j, pass: neo4j)');
        process.exit(1);
      }

      // Try to initialize Redis (optional)
      try {
        if (redisClient.status !== 'ready') {
          await redisClient.connect();
        }
        logger.info('✅ Redis connected successfully');
      } catch (redisError) {
        logger.warn('⚠️  Redis unavailable - running without cache');
      }

      // Start server  
      const PORT = config.port;
      
      // Detach from stdin to prevent EIO errors
      if (process.stdin.isTTY) {
        process.stdin.pause();
      }
      
      const httpServer = this.app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📝 Environment: ${config.nodeEnv}`);
        console.log(`🌐 API: http://localhost:${PORT}/api/v1`);
      });
      
      httpServer.on('error', (error: any) => {
        console.error('Server error:', error);
        process.exit(1);
      });

      // Keep process alive
      await new Promise(() => {});
      await new Promise(() => {});
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Initialize and start server
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await closeNeo4j();
  try {
    if (redisClient.status === 'ready') {
      await redisClient.quit();
    }
  } catch (err) {
    // Redis already closed
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await closeNeo4j();
  try {
    if (redisClient.status === 'ready') {
      await redisClient.quit();
    }
  } catch (err) {
    // Redis already closed
  }
  process.exit(0);
});

export default server.app;
