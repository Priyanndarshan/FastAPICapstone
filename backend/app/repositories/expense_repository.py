from datetime import date
from typing import List, Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.models.expense_model import Expense


def _apply_expense_filters(
    q,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    transaction_type: Optional[str] = None,
    payment_modes: Optional[List[str]] = None,
):
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
    return q
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
    q = _apply_expense_filters(
        q,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        keyword=keyword,
        transaction_type=transaction_type,
        payment_modes=payment_modes,
    )
    return q.order_by(Expense.date.desc(), Expense.id.desc()).all()


def list_expenses_for_user_paged(
    db: Session,
    user_id: int,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    transaction_type: Optional[str] = None,
    payment_modes: Optional[List[str]] = None,
    sort_by: str = "date",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Expense], int, float, float]:
    base_q = db.query(Expense).filter(Expense.user_id == user_id)
    base_q = _apply_expense_filters(
        base_q,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        keyword=keyword,
        transaction_type=transaction_type,
        payment_modes=payment_modes,
    )

    total = base_q.count()

                                                                             
    cash_in_total, cash_out_total = (
        base_q.with_entities(
            func.coalesce(
                func.sum(
                    case((Expense.transaction_type == "in", Expense.amount), else_=0)
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case((Expense.transaction_type == "out", Expense.amount), else_=0)
                ),
                0,
            ),
        )
        .first()
    )

                                         
    q = base_q
    if sort_by == "amount_desc":
        q = q.order_by(Expense.amount.desc(), Expense.id.desc())
    elif sort_by == "amount_asc":
        q = q.order_by(Expense.amount.asc(), Expense.id.asc())
    else:
        q = q.order_by(Expense.date.desc(), Expense.id.desc())

    offset = max(0, (page - 1) * page_size)
    items = q.offset(offset).limit(page_size).all()
    return items, total, float(cash_in_total), float(cash_out_total)
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
