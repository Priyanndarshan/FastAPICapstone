from sqlalchemy.orm import Session
from app.models.budget_model import Budget
def list_budgets_for_user(db: Session, user_id: int) -> list[Budget]:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.id.asc())
        .all()
    )
def create_budget(db: Session, budget: Budget) -> Budget:
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget
def get_budget_for_user(db: Session, user_id: int, budget_id: int) -> Budget | None:
    return (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.id == budget_id)
        .first()
    )
def save_budget(db: Session, budget: Budget) -> Budget:
    db.commit()
    db.refresh(budget)
    return budget
def delete_budget(db: Session, budget: Budget) -> None:
    db.delete(budget)
    db.commit()
