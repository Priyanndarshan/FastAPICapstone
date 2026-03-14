"""Category ORM model.

How this connects to the rest of the code:
- Represents the `categories` table in Postgres.
- Each category belongs to a specific user via `user_id` (so categories are user-scoped).
- Category CRUD endpoints will always filter by the authenticated user (`current_user.id`).
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Foreign key linking each category to its owner user.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ORM relationship (does not create a DB column; it's for easier querying in Python).
    user = relationship("User", back_populates="categories")

    # One-to-many: a category can have many expenses.
    expenses = relationship("Expense")

