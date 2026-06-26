import os
from pydantic_settings import BaseSettings

# Locate the root environment file containing postgres, LiveKit, and microservice configurations.
# We search up the directory tree to find the central .env configuration.
env_path = ".env"
if not os.path.exists(env_path):
    if os.path.exists("../.env"):
        env_path = "../.env"
    elif os.path.exists("../../.env"):
        env_path = "../../.env"

class Settings(BaseSettings):
    """
    Settings schema parsing database, JWT, LiveKit, and AWS credentials from the environment.
    """
    # Security/Auth
    JWT_SECRET_KEY: str = "dev_jwt_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"

    # Microservices
    SERVICE_SCHEDULING_URL: str = "http://localhost:8001"

    # LiveKit Telehealth SFU
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret"

    # AWS S3 Storage & Encryption Parameters (fallback to mock values for dev)
    AWS_ACCESS_KEY_ID: str = "mock_key_id"
    AWS_SECRET_ACCESS_KEY: str = "mock_secret_key"
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "medical-ai-scribe-recordings"
    AWS_S3_ENDPOINT: str = ""  # If using LocalStack or MinIO in development

    # Local storage path for raw audio chunk dump
    RECORDING_DIR: str = "/tmp/medical_ai_recordings"

    class Config:
        env_file = env_path
        extra = "ignore"

settings = Settings()
