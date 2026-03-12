"""Budget routes (HTTP endpoints).

All endpoints require authentication and are scoped to the current user.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.schemas.budget_schema import BudgetCreate, BudgetResponse, BudgetUpdate
from app.services.budget_service import (
    create_user_budget,
    delete_user_budget,
    get_user_budget,
    list_user_budgets,
    update_user_budget,
)


router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=list[BudgetResponse])
def list_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_budgets(db, current_user.id)


@router.post("", response_model=BudgetResponse)
def create_budget(
    body: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_user_budget(db, current_user.id, body.model_dump())


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_budget(db, current_user.id, budget_id)


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = body.model_dump(exclude_unset=True)
    return update_user_budget(db, current_user.id, budget_id, updates)


@router.delete("/{budget_id}")
def remove_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_user_budget(db, current_user.id, budget_id)

