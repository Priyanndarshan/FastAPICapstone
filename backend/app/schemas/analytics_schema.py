"""Pydantic schemas for analytics endpoints."""

from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


# Used inside `MonthlyAnalyticsResponse.categories` to describe per-category totals
# returned by `GET /analytics/monthly` in `analytics_routes.monthly_analytics`.
class MonthlyCategoryBreakdown(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    total_amount: Decimal


# Used as the response model for `GET /analytics/monthly`
# in `analytics_routes.monthly_analytics`.
class MonthlyAnalyticsResponse(BaseModel):
    month: int
    year: int
    total_spent: Decimal
    categories: list[MonthlyCategoryBreakdown]


# Used as the response model for `GET /analytics/top-category`
# in `analytics_routes.top_category`.
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


# Used as the response model for `GET /analytics/trend`
# in `analytics_routes.spending_trend`, with each point representing a month.
class TrendResponse(BaseModel):
    points: list[TrendPoint]

