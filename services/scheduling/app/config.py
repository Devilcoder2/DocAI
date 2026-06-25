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

    class Config:
        env_file = env_path
        extra = "ignore"

settings = Settings()
