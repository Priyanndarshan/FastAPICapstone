"""Category repository (direct DB queries).

How this connects to the rest of the code:
- Called by `app.services.category_service` to perform CRUD on categories.
- Keeps SQLAlchemy query code out of route handlers.
"""

from sqlalchemy.orm import Session

from app.models.category_model import Category


def list_categories_for_user(db: Session, user_id: int):
    return db.query(Category).filter(Category.user_id == user_id).order_by(Category.id.asc()).all()


def create_category(db: Session, user_id: int, name: str):
    category = Category(user_id=user_id, name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_category_for_user(db: Session, user_id: int, category_id: int):
    return (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.id == category_id)
        .first()
    )


def update_category_name(db: Session, category: Category, name: str):
    category.name = name
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: Category):
    db.delete(category)
    db.commit()

