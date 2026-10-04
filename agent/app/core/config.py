from pathlib import Path
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / '.env', extra='ignore')
    database_url: str
    agent_secret: str = Field(min_length=32)
    llm_api_key: str = ''
    llm_model: str = 'gemini-3.8-flash'
    embedding_model: str = 'gemini-embedding-001'
    embedding_dimensions: int = 768
    upload_dir: str = '../backend/uploads'
    chunk_size: int = Field(default=1000, ge=100, le=1800)
    chunk_overlap: int = Field(default=150, ge=0)
    retrieved_chunks: int = Field(default=6, ge=1, le=12)
    min_similarity: float = Field(default=0.35, ge=-1, le=1)
    worker_enabled: bool = True
    ocr_enabled: bool = True
    tesseract_cmd: str = ''
    ocr_language: str = 'eng'
    max_ocr_pages: int = Field(default=100, ge=1, le=300)
    max_media_seconds: int = Field(default=1800, ge=30, le=3600)

    @model_validator(mode='after')
    def validate_dimensions(self):
        if self.embedding_dimensions != 768:
            raise ValueError('Embedding dimensions must match the vector(768) migration.')
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError('Chunk overlap must be smaller than the chunk size.')
        return self

    @property
    def uploads(self) -> Path:
        return (ROOT / self.upload_dir).resolve()


settings = Settings()
