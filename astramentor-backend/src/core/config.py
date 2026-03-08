from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore[import]
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AstraMentor Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]
    
    # Database - PostgreSQL
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # AWS Credentials (Optional - boto3 will use environment/CLI config if not provided)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # DynamoDB
    AWS_REGION: str = "us-east-1"
    DYNAMODB_CHAT_TABLE: str = "astramentor-chat-messages"
    DYNAMODB_INTERACTIONS_TABLE: str = "astramentor-agent-interactions"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50
    
    # AWS Bedrock
    BEDROCK_REGION: str = "us-east-1"
    CLAUDE_SONNET_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    CLAUDE_HAIKU_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"
    TITAN_EMBEDDINGS_MODEL_ID: str = "amazon.titan-embed-text-v1"
    
    # AWS Cognito
    COGNITO_REGION: str = "us-east-1"
    COGNITO_USER_POOL_ID: str
    COGNITO_CLIENT_ID: str
    COGNITO_JWKS_URL: Optional[str] = None
    
    # S3
    S3_BUCKET_NAME: str = "astramentor-repositories"
    
    # Storage Paths
    STORAGE_PATH: str = "./storage"
    GRAPH_STORAGE_PATH: str = "./storage/graphs"
    VECTOR_STORAGE_PATH: str = "./storage/indices"
    REPO_STORAGE_PATH: str = "./storage/repos"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Cost Tracking
    COST_ALERT_THRESHOLD_1: float = 100.0
    COST_ALERT_THRESHOLD_2: float = 200.0
    COST_ALERT_THRESHOLD_3: float = 280.0
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings
