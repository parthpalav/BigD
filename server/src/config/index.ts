import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  
  // Database
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: boolean;
  };
  
  // Redis
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // CORS
  corsOrigins: string[];
  
  // Firebase
  firebase: {
    credentialsPath: string;
    projectId: string;
  };
  
  // Fast2SMS
  fast2sms: {
    apiKey: string;
  };
  
  // WhatsApp Business API
  whatsapp: {
    token: string;
    phoneNumberId: string;
  };
  
  // SendGrid
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  
  // Featherless AI
  featherless: {
    apiKey: string;
    apiUrl: string;
  };
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'traffic_user',
    password: process.env.DB_PASSWORD || 'traffic_pass',
    database: process.env.DB_NAME || 'traffic_db',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  jwtSecret: process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  
  firebase: {
    credentialsPath: process.env.FIREBASE_CREDENTIALS_PATH || './config/firebase-credentials.json',
    projectId: process.env.FIREBASE_PROJECT_ID || 'orion-81736',
  },
  
  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY || '',
  },
  
  whatsapp: {
    token: process.env.WHATSAPP_BUSINESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  },
  
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@trafficpwa.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Traffic Alert System',
  },
  
  featherless: {
    apiKey: process.env.FEATHERLESS_API_KEY || '',
    apiUrl: process.env.FEATHERLESS_API_URL || 'https://api.featherless.ai/v1',
  },
};
