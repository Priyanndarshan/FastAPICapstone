"""Expense repository (direct DB queries).

How this connects to the rest of the code:
- Called by `app.services.expense_service` to perform CRUD on expenses.
- Ensures all queries are user-scoped (by `user_id`).
"""

from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.expense_model import Expense


def list_expenses_for_user(
    db: Session,
    user_id: int,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
):
    q = db.query(Expense).filter(Expense.user_id == user_id)

    if start_date is not None:
        q = q.filter(Expense.date >= start_date)
    if end_date is not None:
        q = q.filter(Expense.date <= end_date)
    if category_id is not None:
        q = q.filter(Expense.category_id == category_id)
    if keyword:
        # Simple "contains" search on notes. (Can be improved later.)
        q = q.filter(Expense.notes.ilike(f"%{keyword}%"))

    return q.order_by(Expense.date.desc(), Expense.id.desc()).all()


def create_expense(db: Session, expense: Expense):
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_expense_for_user(db: Session, user_id: int, expense_id: int):
    return (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.id == expense_id)
        .first()
    )


def save_expense(db: Session, expense: Expense):
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense: Expense):
    db.delete(expense)
    db.commit()

