from datetime import date
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.expense_model import Expense
from app.repositories.category_repository import get_category_for_user
from app.repositories.expense_repository import (
    create_expense,
    delete_expense,
    get_expense_for_user,
    list_expenses_for_user,
    list_expenses_for_user_paged,
    save_expense,
)
def list_user_expenses(
    db: Session,
    user_id: int,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    transaction_type: Optional[str] = None,
    payment_modes: Optional[str] = None,
) -> list[Expense]:
    modes = None
    if payment_modes:
        modes = [m.strip() for m in payment_modes.split(",") if m.strip()]
    return list_expenses_for_user(
        db,
        user_id,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        keyword=keyword,
        transaction_type=transaction_type,
        payment_modes=modes,
    )


def list_user_expenses_paged(
    db: Session,
    user_id: int,
    *,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    transaction_type: Optional[str] = None,
    payment_modes: Optional[str] = None,
    sort_by: str = "date",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Expense], int, float, float]:
    modes = None
    if payment_modes:
        modes = [m.strip() for m in payment_modes.split(",") if m.strip()]
    return list_expenses_for_user_paged(
        db,
        user_id,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        keyword=keyword,
        transaction_type=transaction_type,
        payment_modes=modes,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
def create_user_expense(db: Session, user_id: int, *, payload: dict) -> Expense:
    category_id = payload.get("category_id")
    if category_id is not None:
        if not get_category_for_user(db, user_id, category_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    expense = Expense(user_id=user_id, **payload)
    return create_expense(db, expense)
def get_user_expense(db: Session, user_id: int, expense_id: int) -> Expense:
    expense = get_expense_for_user(db, user_id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense
def update_user_expense(db: Session, user_id: int, expense_id: int, *, updates: dict) -> Expense:
    expense = get_expense_for_user(db, user_id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    if "category_id" in updates:
        category_id = updates["category_id"]
        if category_id is not None and not get_category_for_user(db, user_id, category_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for k, v in updates.items():
        setattr(expense, k, v)
    return save_expense(db, expense)
def delete_user_expense(db: Session, user_id: int, expense_id: int) -> dict:
    expense = get_expense_for_user(db, user_id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    delete_expense(db, expense)
    return {"message": "Expense deleted successfully"}
