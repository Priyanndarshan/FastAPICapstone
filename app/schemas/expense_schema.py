"""Pydantic schemas for Expense endpoints.

How this connects to the rest of the code:
- Used by `app.routes.expense_routes` for request validation and response serialization.
- `from_attributes=True` allows returning SQLAlchemy ORM objects directly.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    category_id: Optional[int] = None
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=10, default="INR")
    date: date
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: bool = False
    recurrence_period: Optional[str] = Field(default=None, max_length=20)


class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=10)
    date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = Field(default=None, max_length=20)


class ExpenseResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    amount: Decimal
    currency: str
    date: date
    notes: Optional[str] = None
    is_recurring: bool
    recurrence_period: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

