from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "dev"
    api_key: str = "changeme"

    openai_api_key: str = ""
    openai_embed_model: str = "text-embedding-3-small"
    openai_gen_model: str = ""

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/eks"
    chroma_path: str = "chroma"
    storage_path: str = "storage"

    file_size_limit_mb: int = 25
    allowed_file_types: str = "pdf,txt,md,markdown"
