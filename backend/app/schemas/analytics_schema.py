from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
class MonthlyCategoryBreakdown(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    total_amount: Decimal
class MonthlyAnalyticsResponse(BaseModel):
    month: int
    year: int
    total_spent: Decimal
    categories: list[MonthlyCategoryBreakdown]
class TopCategoryResponse(BaseModel):
    month: int
    year: int
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    total_amount: Decimal
class TrendPoint(BaseModel):
    month: int
    year: int
    total_spent: Decimal
class TrendResponse(BaseModel):
    points: list[TrendPoint]
