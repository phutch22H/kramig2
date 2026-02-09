from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://ticketing:ticketing_dev@localhost:5432/ticketing"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "dev-secret-key-change-in-production"
    encryption_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    ticketmaster_base_url: str = "https://app.ticketmaster.com"
    ticketmaster_inventory_url: str = "https://app.ticketmaster.com/inventory-status/v1"

    celery_beat_poll_interval_minutes: int = 15
    ticketmaster_inventory_batch_size: int = 350

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
