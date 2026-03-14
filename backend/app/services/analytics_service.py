"""Analytics service: aggregates over expenses.

Used by app/routes/analytics_routes.py; responses match app/schemas/analytics_schema.py.
Reads from Expense and Category models (app/models/).
"""

# Standard library: date arithmetic for trend window and Decimal for money precision.
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

# FastAPI: HTTPException for 4xx responses; status for status code constants.
from fastapi import HTTPException, status
# SQLAlchemy: func for SUM/aggregates, extract for year/month from dates.
from sqlalchemy import func, extract
# Session is injected by get_db in routes; same pattern as other services.
from sqlalchemy.orm import Session

# Category model: used to resolve category_id -> category name in analytics responses.
from app.models.category_model import Category
# Expense model: source of amount, date, user_id, category_id for all analytics queries.
from app.models.expense_model import Expense


def get_monthly_analytics(db: Session, user_id: int, month: int, year: int):
    """Per-month, per-user breakdown by category. Called by GET /analytics/monthly; returns MonthlyAnalyticsResponse shape."""
    # Build query: group expenses by category_id, sum amounts; only this user and this month/year.
    q = (
        db.query(
            # Select category_id and sum(amount); coalesce ensures we get 0 instead of NULL when no rows.
            Expense.category_id,
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .filter(
            # Restrict to current user (matches auth-scoped pattern from routes).
            Expense.user_id == user_id,
            # Restrict to the requested calendar month using SQL extract.
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .group_by(Expense.category_id)
    )

    # Execute query; each row is one category's total for that month.
    rows = q.all()

    # Collect category IDs that appear in the result (may include None for uncategorized).
    category_ids = [r.category_id for r in rows if r.category_id is not None]
    # Look up category names from Category table for display in response.
    names_by_id: dict[int, str] = {}
    if category_ids:
        for c in (
            db.query(Category)
            .filter(Category.id.in_(category_ids))
            .all()
        ):
            names_by_id[c.id] = c.name

    # Build list of category breakdowns and running total for the month.
    categories = []
    total_spent = Decimal("0")

    for r in rows:
        # Convert DB numeric to Decimal for consistent money handling (matches schema).
        amount = Decimal(str(r.total_amount))
        total_spent += amount
        # One entry per category: id, resolved name (or None for uncategorized), and amount.
        categories.append(
            {
                "category_id": r.category_id,
                "category_name": names_by_id.get(r.category_id) if r.category_id is not None else None,
                "total_amount": amount,
            }
        )

    # Return dict matches MonthlyAnalyticsResponse in analytics_schema (month, year, total_spent, categories).
    return {
        "month": month,
        "year": year,
        "total_spent": total_spent,
        "categories": categories,
    }


def get_top_category(db: Session, user_id: int, month: int, year: int):
    """Single category with highest spend for the month. Called by GET /analytics/top-category; returns TopCategoryResponse."""
    # Same filters as monthly: user + month/year; order by sum(amount) descending so first row is top category.
    q = (
        db.query(
            Expense.category_id,
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .filter(
            Expense.user_id == user_id,
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .group_by(Expense.category_id)
        .order_by(func.sum(Expense.amount).desc())
    )

    # Take only the first (highest-spend) group; 404 if user has no expenses that month.
    row = q.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No expenses for given month")

    # Resolve category name from Category table if category_id is set.
    category_name = None
    if row.category_id is not None:
        category = db.query(Category).filter(Category.id == row.category_id).first()
        if category:
            category_name = category.name

    # Use Decimal for amount to align with schema and avoid float issues.
    amount = Decimal(str(row.total_amount))

    # Dict shape matches TopCategoryResponse (month, year, category_id, category_name, total_amount).
    return {
        "month": month,
        "year": year,
        "category_id": row.category_id,
        "category_name": category_name,
        "total_amount": amount,
    }


def get_trend(db: Session, user_id: int, months: int):
    """Spending per month over the last `months` months. Called by GET /analytics/trend; returns TrendResponse (list of points)."""
    if months <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="months must be positive")

    today = date.today()
    # Compute the earliest month to include: go back (months - 1) from current month.
    # Handle year rollback when start_month goes negative (e.g. month 2 with months=4 -> previous year).
    start_year = today.year
    start_month = today.month - (months - 1)
    while start_month <= 0:
        start_month += 12
        start_year -= 1

    # First day of that month: used as inclusive lower bound for expense dates.
    start_date = date(start_year, start_month, 1)

    # Group expenses by (year, month), sum amount; filter by user and date >= start_date.
    q = (
        db.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
        )
        .group_by(extract("year", Expense.date), extract("month", Expense.date))
        .order_by(extract("year", Expense.date), extract("month", Expense.date))
    )

    rows = q.all()
    # Build list of points: each point is year, month, total_spent (TrendPoint in schema).
    points = []
    for r in rows:
        points.append(
            {
                "year": int(r.year),
                "month": int(r.month),
                "total_spent": Decimal(str(r.total_amount)),
            }
        )

    # Matches TrendResponse: single key "points" (list of TrendPoint).
    return {"points": points}
