from sqlalchemy import Column, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base
class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("user_id", "category_id", "month", "year", name="uq_budget_user_category_month_year"),)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)   # e.g. 2026
    limit_amount = Column(Numeric(12, 2), nullable=False)
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
