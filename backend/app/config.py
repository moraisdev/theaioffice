from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgres://gather:gather_password@localhost:5432/gather_clone"
    FRONTEND_URL: str = "http://localhost:3000"
    PORT: int = 3001

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
