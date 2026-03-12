"""FastAPI dependency that provides a SQLAlchemy DB session.

How this connects to the rest of the code:
- Routers (e.g. `app.routes.auth_routes`) use `Depends(get_db)` to get a session.
- Services and repositories accept a `Session` so DB access stays testable and explicit.
"""

from app.database.connection import SessionLocal


def get_db():
    """Yield a DB session for a single request and close it afterwards."""

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()