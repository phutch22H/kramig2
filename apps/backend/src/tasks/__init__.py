from celery import Celery
from celery.schedules import crontab

from src.config import settings

celery_app = Celery("ticketing", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "poll-all-tickets": {
            "task": "src.tasks.poll_tickets.poll_all_tickets",
            "schedule": crontab(minute=f"*/{settings.celery_beat_poll_interval_minutes}"),
        },
    },
)

celery_app.autodiscover_tasks(["src.tasks"])
