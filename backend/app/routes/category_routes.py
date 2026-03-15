from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.db_dependency import get_db
from app.models.user_model import User
from app.schemas.category_schema import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import (
    create_user_category,
    delete_user_category,
    list_user_categories,
    rename_user_category,
)
router = APIRouter(prefix="/categories", tags=["Categories"])
@router.get("", response_model=list[CategoryResponse])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_categories(db, current_user.id)
@router.post("", response_model=CategoryResponse)
def create_category(
    body: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_user_category(db, current_user.id, body.name)
@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    body: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return rename_user_category(db, current_user.id, category_id, body.name)
@router.delete("/{category_id}")
def remove_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_user_category(db, current_user.id, category_id)
