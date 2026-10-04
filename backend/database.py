"""
SQLite connection setup.

One file on disk (ridepair.db) holds everything. In production this same
code points at Postgres by changing DATABASE_URL - nothing else changes.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'ridepair.db')}"

# check_same_thread=False is required because FastAPI serves requests
# from multiple threads, and SQLite is picky about that by default.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    """FastAPI dependency: hands a database session to a route, then always
    closes it - even if the route raises an error."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create any tables that don't exist yet. Safe to call on every startup."""
    from backend import models  # noqa: F401  (registers the tables on Base)
    Base.metadata.create_all(bind=engine)
