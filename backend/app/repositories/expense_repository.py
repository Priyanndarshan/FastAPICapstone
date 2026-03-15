from datetime import date
from typing import List, Optional
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
    transaction_type: Optional[str] = None,
    payment_modes: Optional[List[str]] = None,
) -> list[Expense]:
    q = db.query(Expense).filter(Expense.user_id == user_id)
    if start_date is not None:
        q = q.filter(Expense.date >= start_date)
    if end_date is not None:
        q = q.filter(Expense.date <= end_date)
    if category_id is not None:
        q = q.filter(Expense.category_id == category_id)
    if keyword:
        q = q.filter(Expense.notes.ilike(f"%{keyword}%"))
    if transaction_type is not None:
        q = q.filter(Expense.transaction_type == transaction_type)
    if payment_modes:
        q = q.filter(Expense.payment_mode.in_(payment_modes))
    return q.order_by(Expense.date.desc(), Expense.id.desc()).all()
def create_expense(db: Session, expense: Expense) -> Expense:
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
def get_expense_for_user(db: Session, user_id: int, expense_id: int) -> Expense | None:
    return (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.id == expense_id)
        .first()
    )
def save_expense(db: Session, expense: Expense) -> Expense:
    db.commit()
    db.refresh(expense)
    return expense
def delete_expense(db: Session, expense: Expense) -> None:
    db.delete(expense)
    db.commit()
