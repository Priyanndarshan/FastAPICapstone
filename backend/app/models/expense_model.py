from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
from app.database.base import Base
class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_mode = Column(String, nullable=False, default="CASH")
    transaction_type = Column(String, nullable=False, default="out")
    date = Column(Date, nullable=False, default=date.today)
    notes = Column(String, nullable=True)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurrence_period = Column(String, nullable=True)  # e.g. "daily" | "weekly" | "monthly"
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")
