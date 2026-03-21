from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List

from app.models.budget_model import Budget


def list_budgets_for_user(db: Session, user_id: int) -> List[Budget]:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.id.asc())
        .all()
    )


def create_budget(db: Session, budget: Budget) -> Budget:
    try:
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget

    except SQLAlchemyError:
        db.rollback()
        raise


def get_budget_for_user(db: Session, user_id: int, budget_id: int) -> Optional[Budget]:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.id == budget_id)
        .first()
    )


def save_budget(db: Session, budget: Budget) -> Budget:
    try:
        db.commit()
        db.refresh(budget)
        return budget

    except SQLAlchemyError:
        db.rollback()
        raise


def delete_budget(db: Session, budget: Budget) -> None:
    try:
        db.delete(budget)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise