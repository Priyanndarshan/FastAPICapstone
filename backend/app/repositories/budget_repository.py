"""Budget repository (direct DB queries).

Called by app.services.budget_service for all budget CRUD. All queries are user-scoped.
"""

from sqlalchemy.orm import Session

from app.models.budget_model import Budget


# Returns all budgets for the given user, ordered by year desc, month desc, then id.
def list_budgets_for_user(db: Session, user_id: int) -> list[Budget]:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.id.asc())
        .all()
    )


# Inserts the given budget row, commits, and returns the new budget with id set.
def create_budget(db: Session, budget: Budget) -> Budget:
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


# Returns the budget with the given id if it belongs to the user, else None.
def get_budget_for_user(db: Session, user_id: int, budget_id: int) -> Budget | None:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.id == budget_id)
        .first()
    )


# Commits in-place changes to the budget and returns the refreshed row.
def save_budget(db: Session, budget: Budget) -> Budget:
    db.commit()
    db.refresh(budget)
    return budget


# Deletes the given budget row from the database and commits.
def delete_budget(db: Session, budget: Budget) -> None:
    db.delete(budget)
    db.commit()

