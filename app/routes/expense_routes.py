"""Expense routes (HTTP endpoints).

Endpoints (all require auth):
- GET    /expenses           List expenses (filters: start_date, end_date, category_id, keyword)
- POST   /expenses           Create a new expense
- GET    /expenses/{id}      Get a single expense
- PUT    /expenses/{id}      Update an expense
- DELETE /expenses/{id}      Delete an expense
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.schemas.expense_schema import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.services.expense_service import (
    create_user_expense,
    delete_user_expense,
    get_user_expense,
    list_user_expenses,
    update_user_expense,
)


router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    category_id: Optional[int] = Query(default=None),
    keyword: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_expenses(
        db,
        current_user.id,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        keyword=keyword,
    )


@router.post("", response_model=ExpenseResponse)
def create_expense(
    body: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_user_expense(db, current_user.id, payload=body.model_dump())


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_expense(db, current_user.id, expense_id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    body: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = body.model_dump(exclude_unset=True)
    return update_user_expense(db, current_user.id, expense_id, updates=updates)


@router.delete("/{expense_id}")
def remove_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_user_expense(db, current_user.id, expense_id)

