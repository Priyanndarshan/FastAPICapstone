from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
class ExpenseCreate(BaseModel):
    category_id: Optional[int] = None
    amount: Decimal = Field(gt=0)
    payment_mode: str = Field(default="CASH", max_length=20)  # e.g. UPI, CASH
    transaction_type: str = Field(default="out", pattern="^(in|out)$")
    date: date
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: bool = False
    recurrence_period: Optional[str] = Field(default=None, max_length=20)
class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    payment_mode: Optional[str] = Field(default=None, max_length=20)
    transaction_type: Optional[str] = Field(default=None, pattern="^(in|out)$")
    # Accept date as ISO string to play nicely with the frontend; service parses it.
    date: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = Field(default=None, max_length=20)
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
