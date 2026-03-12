"""Budget service (business logic)."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.budget_model import Budget
from app.repositories.budget_repository import (
    create_budget,
    delete_budget,
    get_budget_for_user,
    list_budgets_for_user,
    save_budget,
)
from app.repositories.category_repository import get_category_for_user


def list_user_budgets(db: Session, user_id: int):
    return list_budgets_for_user(db, user_id)


def create_user_budget(db: Session, user_id: int, payload: dict):
    category_id = payload["category_id"]
    # Ensure the category belongs to this user.
    if not get_category_for_user(db, user_id, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    budget = Budget(user_id=user_id, **payload)
    return create_budget(db, budget)


def get_user_budget(db: Session, user_id: int, budget_id: int):
    budget = get_budget_for_user(db, user_id, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


def update_user_budget(db: Session, user_id: int, budget_id: int, updates: dict):
    budget = get_budget_for_user(db, user_id, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    if "category_id" in updates:
        category_id = updates["category_id"]
        if category_id is not None and not get_category_for_user(db, user_id, category_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    for k, v in updates.items():
        setattr(budget, k, v)

    return save_budget(db, budget)


def delete_user_budget(db: Session, user_id: int, budget_id: int):
    budget = get_budget_for_user(db, user_id, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    delete_budget(db, budget)
    return {"message": "Budget deleted successfully"}

