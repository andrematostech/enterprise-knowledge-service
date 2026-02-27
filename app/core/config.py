from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",
        case_sensitive=False,
    )

    app_env: str = "dev"
    api_key: str = "changeme"
    disable_api_key_in_prod: bool = False
    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60

    openai_api_key: str = ""
    openai_embed_model: str = "text-embedding-3-small"
    openai_gen_model: str = ""
    openai_prompt_cost_per_1k: float | None = None
    openai_completion_cost_per_1k: float | None = None

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/eks"
    chroma_path: str = "chroma"
    storage_path: str = "storage"

    file_size_limit_mb: int = 25
    allowed_file_types: str = "pdf,txt,md,markdown"

    chunk_size: int = 800
    chunk_overlap: int = 100

    auto_migrate: bool = True
