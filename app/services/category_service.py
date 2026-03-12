"""Category service (business logic for category CRUD).

How this connects to the rest of the code:
- Called by `app.routes.category_routes` after auth has identified `current_user`.
- Calls `app.repositories.category_repository` to interact with the DB.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.category_repository import (
    create_category,
    delete_category,
    get_category_for_user,
    list_categories_for_user,
    update_category_name,
)


def list_user_categories(db: Session, user_id: int):
    return list_categories_for_user(db, user_id)


def create_user_category(db: Session, user_id: int, name: str):
    return create_category(db, user_id, name)


def rename_user_category(db: Session, user_id: int, category_id: int, name: str):
    category = get_category_for_user(db, user_id, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return update_category_name(db, category, name)


def delete_user_category(db: Session, user_id: int, category_id: int):
    category = get_category_for_user(db, user_id, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    delete_category(db, category)
    return {"message": "Category deleted successfully"}

