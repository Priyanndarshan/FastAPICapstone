"""Budget ORM model.

Represents a monthly budget for a given user + category.
"""

from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from app.database.base import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    # Owner of this budget.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Category this budget applies to (Food, Travel, etc.).
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)

    # Month and year this budget is for.
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)   # e.g. 2026

    # Limit amount for this category in the given month.
    limit_amount = Column(Numeric(12, 2), nullable=False)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

