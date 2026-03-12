"""Analytics routes (HTTP endpoints).

All endpoints require authentication and are scoped to the current user.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.schemas.analytics_schema import (
    MonthlyAnalyticsResponse,
    TopCategoryResponse,
    TrendResponse,
)
from app.services.analytics_service import (
    get_monthly_analytics,
    get_top_category,
    get_trend,
)


router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/monthly", response_model=MonthlyAnalyticsResponse)
def monthly_analytics(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_monthly_analytics(db, current_user.id, month, year)


@router.get("/top-category", response_model=TopCategoryResponse)
def top_category(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_top_category(db, current_user.id, month, year)


@router.get("/trend", response_model=TrendResponse)
def spending_trend(
    months: int = Query(6, ge=1, le=60),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_trend(db, current_user.id, months)

