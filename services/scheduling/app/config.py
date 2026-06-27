import os
from pydantic_settings import BaseSettings

# Locate the root environment file containing postgres credentials
# We search up the directory tree to find the central .env configuration
env_path = ".env"
if not os.path.exists(env_path):
    if os.path.exists("../.env"):
        env_path = "../.env"
    elif os.path.exists("../../.env"):
        env_path = "../../.env"

class Settings(BaseSettings):
    """
    Settings schema parsing database and authentication keys from local environment.
    """
    DATABASE_URL: str = "postgresql://medical_ai_user:medical_ai_password@localhost:5432/medical_ai_db"
    JWT_SECRET_KEY: str = "dev_jwt_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    RABBITMQ_URL: str = "amqp://medical_ai_mq_user:medical_ai_mq_password@localhost:5672/"
    
    # SMTP Email Notifier parameters
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@telehealth-medical-ai.com"

    class Config:
        env_file = env_path
        extra = "ignore"

settings = Settings()
