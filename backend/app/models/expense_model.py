"""Expense ORM model.

How this connects to the rest of the code:
- Represents the `expenses` table in Postgres.
- Each expense belongs to a user (`user_id`) and (optionally) to a category (`category_id`).
- Expense endpoints will always be user-scoped using the authenticated `current_user.id`.
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    # Ownership: ensures users can only see their own expenses.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Categorization: optional (you may allow uncategorized expenses).
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)

    # Monetary fields.
    amount = Column(Numeric(12, 2), nullable=False)
    # Payment mode: UPI, CASH, etc.
    payment_mode = Column(String, nullable=False, default="CASH")
    # Transaction direction: "in" (Cash In) or "out" (Cash Out).
    transaction_type = Column(String, nullable=False, default="out")

    # When the expense occurred.
    date = Column(Date, nullable=False, default=date.today)

    # Optional free-form note.
    notes = Column(String, nullable=True)

    # Recurrence metadata.
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurrence_period = Column(String, nullable=True)  # e.g. "daily" | "weekly" | "monthly"

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # ORM relationships for convenience (no additional DB columns).
    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")

