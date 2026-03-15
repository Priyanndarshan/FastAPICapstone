from sqlalchemy.orm import Session
from app.models.category_model import Category
def list_categories_for_user(db: Session, user_id: int) -> list[Category]:
    return db.query(Category).filter(Category.user_id == user_id).order_by(Category.id.asc()).all()
def create_category(db: Session, user_id: int, name: str) -> Category:
    category = Category(user_id=user_id, name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
def get_category_for_user(db: Session, user_id: int, category_id: int) -> Category | None:
    return (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.id == category_id)
        .first()
    )
def update_category_name(db: Session, category: Category, name: str) -> Category:
    category.name = name
    db.commit()
    db.refresh(category)
    return category
def delete_category(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()
