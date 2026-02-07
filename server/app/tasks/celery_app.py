"""
Celery Configuration for Background Tasks
Handles scheduled predictions, alerts, and data processing
"""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    'traffic_tasks',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=['app.tasks.scheduled_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Scheduled tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Generate predictions every hour
    'generate-hourly-predictions': {
        'task': 'app.tasks.scheduled_tasks.generate_predictions_for_all_locations',
        'schedule': crontab(minute=0),  # Every hour at minute 0
    },
    # Check for congestion alerts every 15 minutes
    'check-congestion-alerts': {
        'task': 'app.tasks.scheduled_tasks.check_and_send_congestion_alerts',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    # Cleanup old data daily at 2 AM
    'cleanup-old-data': {
        'task': 'app.tasks.scheduled_tasks.cleanup_old_data',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}
