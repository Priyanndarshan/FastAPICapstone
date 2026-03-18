from pydantic import BaseModel
from app.schemas.analytics_schema import (
    MonthlyAnalyticsResponse,
    TrendResponse,
)


class DashboardResponse(BaseModel):
    """Single response combining data the Dashboard UI needs."""

    monthly: MonthlyAnalyticsResponse
    trend: TrendResponse
