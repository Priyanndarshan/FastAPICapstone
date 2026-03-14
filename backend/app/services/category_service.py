"""Category service (business logic for category CRUD).

How this connects to the rest of the code:
- Called by `app.routes.category_routes` after auth has identified `current_user`.
- Uses `app.repositories.category_repository` for all DB access (list, create, get, update, delete).
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


# Called by GET /categories in category_routes.list_categories. Returns all categories for the user.
def list_user_categories(db: Session, user_id: int) -> list:
    return list_categories_for_user(db, user_id)


# Called by POST /categories in category_routes.create_category. Creates a category via repository.
def create_user_category(db: Session, user_id: int, name: str):
    return create_category(db, user_id, name)


# Called by PUT /categories/{category_id} in category_routes.update_category. Ensures category
# exists and belongs to user, then renames it via category_repository.update_category_name.
def rename_user_category(db: Session, user_id: int, category_id: int, name: str):
    category = get_category_for_user(db, user_id, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return update_category_name(db, category, name)


# Called by DELETE /categories/{category_id} in category_routes.remove_category. Ensures category
# exists and belongs to user, then deletes via category_repository.delete_category.
def delete_user_category(db: Session, user_id: int, category_id: int) -> dict:
    category = get_category_for_user(db, user_id, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    delete_category(db, category)
    return {"message": "Category deleted successfully"}

