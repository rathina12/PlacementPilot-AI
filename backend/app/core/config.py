from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "StudentDigitalTwin"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # MongoDB Atlas
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "student_digital_twin"

    # AI (optional)
    ANTHROPIC_API_KEY: Optional[str] = None

    # SMS (optional)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # GitHub (optional)
    GITHUB_TOKEN: Optional[str] = None

    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
