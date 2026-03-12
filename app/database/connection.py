"""Database connection configuration (SQLAlchemy).

How this connects to the rest of the code:
- `engine` is used by `app.main` to create tables (`Base.metadata.create_all(bind=engine)`).
- `SessionLocal` is used by `app.dependencies.db_dependency.get_db()` to provide a per-request DB session.

This module is the single source of truth for the database URL and session factory.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:Indium%40123@localhost:5432/expense_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)