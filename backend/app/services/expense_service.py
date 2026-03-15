"""Expense service (business logic for expense CRUD + validation).

How this connects to the rest of the code:
- Called by `app.routes.expense_routes` after auth identifies `current_user`.
- Uses `app.repositories.expense_repository` for DB access and
  `app.repositories.category_repository.get_category_for_user` to validate category ownership.
"""

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
    save_expense,
)


# Called by GET /expenses in expense_routes.list_expenses. Passes query params to
# expense_repository.list_expenses_for_user for filtering.
def list_user_expenses(
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
    return list_expenses_for_user(
        db,
        user_id,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        keyword=keyword,
        transaction_type=transaction_type,
        payment_modes=payment_modes,
    )


# Called by POST /expenses in expense_routes.create_expense. Validates category (if provided)
# belongs to user, builds Expense from payload, then creates via expense_repository.create_expense.
def create_user_expense(db: Session, user_id: int, *, payload: dict) -> Expense:
    category_id = payload.get("category_id")
    if category_id is not None:
        # Prevent creating expenses under other users' categories.
        if not get_category_for_user(db, user_id, category_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    expense = Expense(user_id=user_id, **payload)
    return create_expense(db, expense)


# Called by GET /expenses/{expense_id} in expense_routes.get_expense. Returns single expense or 404.
def get_user_expense(db: Session, user_id: int, expense_id: int) -> Expense:
    expense = get_expense_for_user(db, user_id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


# Called by PUT /expenses/{expense_id} in expense_routes.update_expense. Validates expense exists;
# if category_id is in updates, validates that category belongs to user, then applies updates and saves.
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


# Called by DELETE /expenses/{expense_id} in expense_routes.remove_expense. Deletes expense or 404.
def delete_user_expense(db: Session, user_id: int, expense_id: int) -> dict:
    expense = get_expense_for_user(db, user_id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    delete_expense(db, expense)
    return {"message": "Expense deleted successfully"}

