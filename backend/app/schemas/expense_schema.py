"""Pydantic schemas for Expense endpoints.

How this connects to the rest of the code:
- Used by `app.routes.expense_routes` for request validation and response serialization.
- `from_attributes=True` allows returning SQLAlchemy ORM objects directly.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# Used as the request body schema for `POST /expenses`
# in `expense_routes.create_expense`.
class ExpenseCreate(BaseModel):
    category_id: Optional[int] = None
    amount: Decimal = Field(gt=0)
    payment_mode: str = Field(default="CASH", max_length=20)  # e.g. UPI, CASH
    transaction_type: str = Field(default="out", pattern="^(in|out)$")
    date: date
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: bool = False
    recurrence_period: Optional[str] = Field(default=None, max_length=20)


# Used as the request body schema for `PUT /expenses/{expense_id}`
# in `expense_routes.update_expense`.
class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    payment_mode: Optional[str] = Field(default=None, max_length=20)
    transaction_type: Optional[str] = Field(default=None, pattern="^(in|out)$")
    date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = Field(default=None, max_length=20)


# Used as the response model for:
# - `GET  /expenses`              (`expense_routes.list_expenses`)
# - `POST /expenses`              (`expense_routes.create_expense`)
# - `GET  /expenses/{expense_id}` (`expense_routes.get_expense`)
# - `PUT  /expenses/{expense_id}` (`expense_routes.update_expense`)
class ExpenseResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    amount: Decimal
    payment_mode: str
    transaction_type: str
    date: date
    notes: Optional[str] = None
    is_recurring: bool
    recurrence_period: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

