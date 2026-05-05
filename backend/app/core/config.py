from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:password@localhost:5432/assessment_db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "False").lower() in ("true", "1", "t")
    
    # Bhashini
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "your_bhashini_api_key")
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    BHASHINI_INFERENCE_KEY: str = os.getenv("BHASHINI_INFERENCE_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()
