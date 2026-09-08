"""SQLAlchemy engine, session factory, and declarative base."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

db_url = str(settings.database_url).strip('"\' \t\n\r') if settings.database_url else ""
if not db_url:
    db_url = "postgresql+psycopg2://postgres:postgres@localhost:5432/real_estate_crm"
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if not db_url.startswith("postgresql"):
    raise ValueError(f"DEBUG RENDER ENV: The raw database_url was {repr(settings.database_url)} and db_url became {repr(db_url)}")


engine = create_engine(db_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a request-scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
