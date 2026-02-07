"""
Multi-Channel Notification Service
Firebase Push, Email, SMS, and WhatsApp alerts
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Unified notification service for all channels"""
    
    def __init__(self):
        self.firebase_initialized = False
        self.twilio_client = None
        self.sendgrid_client = None
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize notification service clients"""
        
        # Firebase Cloud Messaging
        try:
            import firebase_admin
            from firebase_admin import credentials, messaging
            
            if not firebase_admin._apps:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
            
            self.firebase_initialized = True
            logger.info("Firebase initialized")
        except Exception as e:
            logger.warning(f"Firebase initialization failed: {e}")
        
        # Twilio (SMS & WhatsApp)
        try:
            from twilio.rest import Client
            self.twilio_client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            logger.info("Twilio initialized")
        except Exception as e:
            logger.warning(f"Twilio initialization failed: {e}")
        
        # SendGrid (Email)
        try:
            from sendgrid import SendGridAPIClient
            self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
            logger.info("SendGrid initialized")
        except Exception as e:
            logger.warning(f"SendGrid initialization failed: {e}")
    
    async def send_push_notification(
        self,
        fcm_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> bool:
        """
        Send Firebase Cloud Messaging push notification
        
        Args:
            fcm_token: FCM device token
            title: Notification title
            body: Notification body
            data: Additional data payload
        
        Returns:
            Success status
        """
        if not self.firebase_initialized:
            logger.error("Firebase not initialized")
            return False
        
        try:
            from firebase_admin import messaging
            
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                data=data or {},
                token=fcm_token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        icon='traffic_icon',
                        color='#FF0000'
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            badge=1,
                            sound='default'
                        )
                    )
                )
            )
            
            response = messaging.send(message)
            logger.info(f"Push notification sent: {response}")
            return True
        
        except Exception as e:
            logger.error(f"Push notification error: {e}")
            return False
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        """
        Send email via SendGrid
        
        Args:
            to_email: Recipient email
            subject: Email subject
            html_content: HTML email body
            plain_content: Plain text alternative
        
        Returns:
            Success status
        """
        if not self.sendgrid_client:
            logger.error("SendGrid not initialized")
            return False
        
        try:
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            message = Mail(
                from_email=Email(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if plain_content:
                message.add_content(Content("text/plain", plain_content))
            
            response = self.sendgrid_client.send(message)
            logger.info(f"Email sent to {to_email}: {response.status_code}")
            return response.status_code == 202
        
        except Exception as e:
            logger.error(f"Email send error: {e}")
            return False
    
    async def send_sms(
        self,
        to_phone: str,
        message: str
    ) -> bool:
        """
        Send SMS via Twilio
        
        Args:
            to_phone: Recipient phone number
            message: SMS message body
        
        Returns:
            Success status
        """
        if not self.twilio_client:
            logger.error("Twilio not initialized")
            return False
        
        try:
            result = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            logger.info(f"SMS sent to {to_phone}: {result.sid}")
            return True
        
        except Exception as e:
            logger.error(f"SMS send error: {e}")
            return False
    
    async def send_whatsapp(
        self,
        to_phone: str,
        message: str
    ) -> bool:
        """
        Send WhatsApp message via Twilio
        
        Args:
            to_phone: Recipient phone number (with country code)
            message: WhatsApp message body
        
        Returns:
            Success status
        """
        if not self.twilio_client:
            logger.error("Twilio not initialized")
            return False
        
        try:
            # Ensure phone number has whatsapp: prefix
            if not to_phone.startswith('whatsapp:'):
                to_phone = f'whatsapp:{to_phone}'
            
            result = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_WHATSAPP_NUMBER,
                to=to_phone
            )
            logger.info(f"WhatsApp sent to {to_phone}: {result.sid}")
            return True
        
        except Exception as e:
            logger.error(f"WhatsApp send error: {e}")
            return False
    
    async def send_multi_channel_alert(
        self,
        user_preferences: Dict[str, Any],
        alert_data: Dict[str, Any]
    ) -> Dict[str, bool]:
        """
        Send alert via all enabled channels for user
        
        Args:
            user_preferences: User notification preferences
            alert_data: Alert content (title, message, etc.)
        
        Returns:
            Status for each channel
        """
        results = {}
        tasks = []
        
        # Push notification
        if user_preferences.get('push_enabled') and user_preferences.get('fcm_token'):
            tasks.append(
                ('push', self.send_push_notification(
                    user_preferences['fcm_token'],
                    alert_data['title'],
                    alert_data['message'],
                    alert_data.get('data')
                ))
            )
        
        # Email
        if user_preferences.get('email_enabled') and user_preferences.get('email'):
            html_content = self._format_email_html(alert_data)
            tasks.append(
                ('email', self.send_email(
                    user_preferences['email'],
                    alert_data['title'],
                    html_content,
                    alert_data['message']
                ))
            )
        
        # SMS
        if user_preferences.get('sms_enabled') and user_preferences.get('phone'):
            sms_message = f"{alert_data['title']}\n\n{alert_data['message']}"
            tasks.append(
                ('sms', self.send_sms(
                    user_preferences['phone'],
                    sms_message
                ))
            )
        
        # WhatsApp
        if user_preferences.get('whatsapp_enabled') and user_preferences.get('phone'):
            wa_message = f"🚦 *{alert_data['title']}*\n\n{alert_data['message']}"
            tasks.append(
                ('whatsapp', self.send_whatsapp(
                    user_preferences['phone'],
                    wa_message
                ))
            )
        
        # Execute all notifications concurrently
        if tasks:
            for channel, coro in tasks:
                try:
                    results[channel] = await coro
                except Exception as e:
                    logger.error(f"Error sending {channel} notification: {e}")
                    results[channel] = False
        
        return results
    
    def _format_email_html(self, alert_data: Dict[str, Any]) -> str:
        """Format alert as HTML email"""
        severity_colors = {
            'low': '#28a745',
            'medium': '#ffc107',
            'high': '#fd7e14',
            'critical': '#dc3545'
        }
        
        color = severity_colors.get(alert_data.get('severity', 'medium'), '#ffc107')
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: {color}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🚦 {alert_data['title']}</h1>
                </div>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
                    <p style="font-size: 16px;">{alert_data['message']}</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 14px; color: #666;">
                        <strong>Location:</strong> {alert_data.get('location', 'N/A')}<br>
                        <strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
                    </p>
                    <p style="font-size: 12px; color: #999; margin-top: 30px;">
                        Urban Traffic Congestion Alert System<br>
                        You're receiving this because you've subscribed to traffic alerts.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
