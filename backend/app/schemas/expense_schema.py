from datetime import date as date_type
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
class ExpenseCreate(BaseModel):
    category_id: Optional[int] = None
    amount: Decimal = Field(gt=0)
    payment_mode: str = Field(default="CASH", max_length=20)  # e.g. UPI, CASH
    transaction_type: str = Field(default="out", pattern="^(in|out)$")
    date: date_type
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: bool = False
    recurrence_period: Optional[str] = Field(default=None, max_length=20)
    receipt_url: Optional[str] = Field(default=None, max_length=2048)
class ExpenseUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    payment_mode: Optional[str] = Field(default=None, max_length=20)
    transaction_type: Optional[str] = Field(default=None, pattern="^(in|out)$")
    date: Optional[date_type] = None
    notes: Optional[str] = Field(default=None, max_length=500)
    is_recurring: Optional[bool] = None
    recurrence_period: Optional[str] = Field(default=None, max_length=20)
    receipt_url: Optional[str] = Field(default=None, max_length=2048)  # set to null/empty to remove

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):  # noqa: B902
        if v is None:
            return None
        if isinstance(v, date_type):
            return v
        if isinstance(v, str):
            s = v.strip()[:10]
            if len(s) == 10 and s[4] == "-" and s[7] == "-":
                return date_type(int(s[:4]), int(s[5:7]), int(s[8:10]))
        raise ValueError("Invalid date format, use YYYY-MM-DD")
class ExpenseResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    amount: Decimal
    payment_mode: str
    transaction_type: str
    date: date_type
    notes: Optional[str] = None
    is_recurring: bool
    recurrence_period: Optional[str] = None
    receipt_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Paginated response wrapper for server-side pagination of expenses
class PaginatedExpensesResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
    page: int
    page_size: int
    cash_in_total: Decimal
    cash_out_total: Decimal
