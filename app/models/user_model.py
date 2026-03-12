from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)

    # One-to-many relationship: a user can have many categories.
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")

    # One-to-many relationship: a user can have many expenses.
    expenses = relationship("Expense", cascade="all, delete-orphan")

    # One-to-many relationship: a user can have many budgets.
    budgets = relationship("Budget", cascade="all, delete-orphan")