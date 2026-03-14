"""Category repository (direct DB queries).

How this connects to the rest of the code:
- Called by `app.services.category_service` to perform CRUD on categories.
- Keeps SQLAlchemy query code out of route handlers.
"""

from sqlalchemy.orm import Session

from app.models.category_model import Category


# Returns all categories for the given user, ordered by id ascending.
def list_categories_for_user(db: Session, user_id: int) -> list[Category]:
    return db.query(Category).filter(Category.user_id == user_id).order_by(Category.id.asc()).all()


# Creates a new category for the user with the given name; commits and returns the new row.
def create_category(db: Session, user_id: int, name: str) -> Category:
    category = Category(user_id=user_id, name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# Returns the category with the given id if it belongs to the user, else None.
def get_category_for_user(db: Session, user_id: int, category_id: int) -> Category | None:
    return (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.id == category_id)
        .first()
    )


# Updates the category's name in place, commits, and returns the refreshed category.
def update_category_name(db: Session, category: Category, name: str) -> Category:
    category.name = name
    db.commit()
    db.refresh(category)
    return category


# Deletes the given category row from the database and commits.
def delete_category(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()

