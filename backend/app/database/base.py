"""SQLAlchemy declarative base.

How this connects to the rest of the code:
- All ORM models (e.g. `app.models.user_model.User`) inherit from `Base`.
- `app.main` calls `Base.metadata.create_all(...)` to create tables for all imported models.
"""

from sqlalchemy.orm import declarative_base

Base = declarative_base()