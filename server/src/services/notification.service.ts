import axios from 'axios';
import * as admin from 'firebase-admin';
import logger from '../utils/logger';

interface NotificationPayload {
  recipient: string;
  message: string;
  title?: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private fast2smsApiKey: string;
  private whatsappToken: string;
  private whatsappPhoneNumberId: string;
  private sendgridApiKey: string;
  private firebaseApp: admin.app.App | null = null;

  constructor() {
    this.fast2smsApiKey = process.env.FAST2SMS_API_KEY || '';
    this.whatsappToken = process.env.WHATSAPP_BUSINESS_TOKEN || '';
    this.whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.sendgridApiKey = process.env.SENDGRID_API_KEY || '';
    
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        logger.info('✓ Firebase Admin initialized');
      }
    } catch (error) {
      logger.error('Firebase initialization error:', error);
    }
  }

  /**
   * Send SMS via Fast2SMS (Indian service)
   */
  async sendSMS(payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'v3',
          sender_id: 'TXTIND',
          message: payload.message,
          language: 'english',
          flash: 0,
          numbers: payload.recipient.replace('+91', ''), // 10-digit Indian number
        },
        {
          headers: {
            'authorization': this.fast2smsApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`SMS sent successfully to ${payload.recipient}`);
      return response.data.return === true;
    } catch (error) {
      logger.error('SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send WhatsApp message via WhatsApp Business API
   */
  async sendWhatsApp(payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.whatsappPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: payload.recipient,
          type: 'text',
          text: {
            body: payload.message,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsappToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`WhatsApp sent successfully to ${payload.recipient}`);
      return response.status === 200;
    } catch (error) {
      logger.error('WhatsApp sending error:', error);
      return false;
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   */
  async sendPushNotification(fcmToken: string, payload: NotificationPayload): Promise<boolean> {
    try {
      if (!this.firebaseApp) {
        throw new Error('Firebase not initialized');
      }

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: payload.title || 'Traffic Alert',
          body: payload.message,
        },
        data: payload.data || {},
      };

      await admin.messaging().send(message);
      logger.info(`Push notification sent to ${fcmToken.substring(0, 20)}...`);
      return true;
    } catch (error) {
      logger.error('Push notification error:', error);
      return false;
    }
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(email: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [
            {
              to: [{ email }],
              subject: payload.title || 'Traffic Alert',
            },
          ],
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@traffic.com',
            name: 'Traffic Alert System',
          },
          content: [
            {
              type: 'text/plain',
              value: payload.message,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Email sent successfully to ${email}`);
      return response.status === 202;
    } catch (error) {
      logger.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send alert via multiple channels
   */
  async sendMultiChannelAlert(
    user: { email?: string; phoneNumber?: string; fcmToken?: string },
    payload: NotificationPayload,
    channels: ('email' | 'sms' | 'whatsapp' | 'push')[]
  ): Promise<{ channel: string; success: boolean }[]> {
    const results: { channel: string; success: boolean }[] = [];

    for (const channel of channels) {
      try {
        let success = false;

        switch (channel) {
          case 'email':
            if (user.email) success = await this.sendEmail(user.email, payload);
            break;
          case 'sms':
            if (user.phoneNumber) success = await this.sendSMS({ ...payload, recipient: user.phoneNumber });
            break;
          case 'whatsapp':
            if (user.phoneNumber) success = await this.sendWhatsApp({ ...payload, recipient: user.phoneNumber });
            break;
          case 'push':
            if (user.fcmToken) success = await this.sendPushNotification(user.fcmToken, payload);
            break;
        }

        results.push({ channel, success });
      } catch (error) {
        logger.error(`Error sending ${channel}:`, error);
        results.push({ channel, success: false });
      }
    }

    return results;
  }
}

export default new NotificationService();
