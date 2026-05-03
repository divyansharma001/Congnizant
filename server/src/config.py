from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    dynamodb_endpoint: str = "http://localhost:8001"
    aws_region: str = "us-east-1"

    api_key: str = "test-key"
    traces_db_path: str = "/app/traces/agent_traces.db"
    opensearch_host: str = "opensearch"
    opensearch_port: int = 9200

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
