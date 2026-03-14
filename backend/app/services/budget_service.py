"""Budget service (business logic).

How this connects to the rest of the code:
- Called by `app.routes.budget_routes` after auth identifies `current_user`.
- Uses `app.repositories.budget_repository` for DB access and
  `app.repositories.category_repository.get_category_for_user` to validate category ownership.
"""

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


# Called by GET /budgets in budget_routes.list_budgets. Returns all budgets for the user.
def list_user_budgets(db: Session, user_id: int) -> list[Budget]:
    return list_budgets_for_user(db, user_id)


# Called by POST /budgets in budget_routes.create_budget. Validates category belongs to user,
# then creates a Budget via budget_repository.create_budget.
def create_user_budget(db: Session, user_id: int, payload: dict) -> Budget:
    category_id = payload["category_id"]
    # Ensure the category belongs to this user (prevents linking budget to another user's category).
    if not get_category_for_user(db, user_id, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    budget = Budget(user_id=user_id, **payload)
    return create_budget(db, budget)


# Called by GET /budgets/{budget_id} in budget_routes.get_budget. Returns single budget or 404.
def get_user_budget(db: Session, user_id: int, budget_id: int) -> Budget:
    budget = get_budget_for_user(db, user_id, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


# Called by PUT /budgets/{budget_id} in budget_routes.update_budget. Validates budget exists and
# (if category_id is in updates) that the new category belongs to the user, then applies updates.
def update_user_budget(db: Session, user_id: int, budget_id: int, updates: dict) -> Budget:
    budget = get_budget_for_user(db, user_id, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    # If changing category, ensure it belongs to this user.
    if "category_id" in updates:
        category_id = updates["category_id"]
        if category_id is not None and not get_category_for_user(db, user_id, category_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    for k, v in updates.items():
        setattr(budget, k, v)

    return save_budget(db, budget)


# Called by DELETE /budgets/{budget_id} in budget_routes.remove_budget. Deletes budget or 404.
def delete_user_budget(db: Session, user_id: int, budget_id: int) -> dict:
    budget = get_budget_for_user(db, user_id, budget_id)
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    delete_budget(db, budget)
    return {"message": "Budget deleted successfully"}

