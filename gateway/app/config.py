import os
from pydantic_settings import BaseSettings

# Attempt to locate .env in current or parent directory
env_path = ".env"
if not os.path.exists(env_path) and os.path.exists("../.env"):
    env_path = "../.env"

class Settings(BaseSettings):
    GATEWAY_HOST: str = "0.0.0.0"
    GATEWAY_PORT: int = 8000
    JWT_SECRET_KEY: str = "dev_jwt_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    DATABASE_URL: str = "postgresql://medical_ai_user:medical_ai_password@localhost:5432/medical_ai_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    RABBITMQ_URL: str = "amqp://medical_ai_mq_user:medical_ai_mq_password@localhost:5672/"
    
    SERVICE_SCHEDULING_URL: str = "http://localhost:8001"
    SERVICE_TELEHEALTH_URL: str = "http://localhost:8002"
    SERVICE_SCRIBE_URL: str = "http://localhost:8003"
    SERVICE_AGENT_URL: str = "http://localhost:8004"

    class Config:
        env_file = env_path
        extra = "ignore"

settings = Settings()
