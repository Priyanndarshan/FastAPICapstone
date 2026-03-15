from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from app.models.category_model import Category
from app.models.expense_model import Expense
def get_monthly_analytics(db: Session, user_id: int, month: int, year: int):
    q = (
        db.query(
            Expense.category_id,
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.transaction_type == "out",
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .group_by(Expense.category_id)
    )
    rows = q.all()
    category_ids = [r.category_id for r in rows if r.category_id is not None]
    names_by_id: dict[int, str] = {}
    if category_ids:
        for c in (
            db.query(Category)
            .filter(Category.id.in_(category_ids))
            .all()
        ):
            names_by_id[c.id] = c.name
    categories = []
    total_spent = Decimal("0")
    for r in rows:
        amount = Decimal(str(r.total_amount))
        total_spent += amount
        categories.append(
            {
                "category_id": r.category_id,
                "category_name": names_by_id.get(r.category_id) if r.category_id is not None else None,
                "total_amount": amount,
            }
        )
    return {
        "month": month,
        "year": year,
        "total_spent": total_spent,
        "categories": categories,
    }
def get_top_category(db: Session, user_id: int, month: int, year: int):
    q = (
        db.query(
            Expense.category_id,
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.transaction_type == "out",
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .group_by(Expense.category_id)
        .order_by(func.sum(Expense.amount).desc())
    )
    row = q.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No expenses for given month")
    category_name = None
    if row.category_id is not None:
        category = db.query(Category).filter(Category.id == row.category_id).first()
        if category:
            category_name = category.name
    amount = Decimal(str(row.total_amount))
    return {
        "month": month,
        "year": year,
        "category_id": row.category_id,
        "category_name": category_name,
        "total_amount": amount,
    }
def get_trend(db: Session, user_id: int, months: int):
    if months <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="months must be positive")
    today = date.today()
    start_year = today.year
    start_month = today.month - (months - 1)
    while start_month <= 0:
        start_month += 12
        start_year -= 1
    start_date = date(start_year, start_month, 1)
    q = (
        db.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.transaction_type == "out",
            Expense.date >= start_date,
        )
        .group_by(extract("year", Expense.date), extract("month", Expense.date))
        .order_by(extract("year", Expense.date), extract("month", Expense.date))
    )
    rows = q.all()
    points = []
    for r in rows:
        points.append(
            {
                "year": int(r.year),
                "month": int(r.month),
                "total_spent": Decimal(str(r.total_amount)),
            }
        )
    return {"points": points}
