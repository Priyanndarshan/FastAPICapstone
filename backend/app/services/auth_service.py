from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user_schema import UserRegister, UserProfileUpdate
from app.repositories.user_repository import (
    get_user_by_email,
    create_user,
    update_user,
)
from app.repositories.auth_repository import (
    delete_all_refresh_tokens_for_user,
    delete_refresh_token,
    get_refresh_token,
    save_refresh_token,
)
from app.utils.password_handler import (
    hash_password,
    verify_password,
)
from app.utils.jwt_handler import (
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM,
)
def register_user(db: Session, user_data: UserRegister):
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_password = hash_password(user_data.password)
    new_user = create_user(
        db,
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        phone=user_data.phone,
    )
    return new_user
def update_user_profile(db: Session, user_id: int, data: UserProfileUpdate):
    payload = data.model_dump(exclude_unset=True)
    updated = update_user(db, user_id, **payload)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated
def login_user(db: Session, form_data: OAuth2PasswordRequestForm) -> dict:
    user = get_user_by_email(db, form_data.username)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token({"user_id": user.id})
    refresh_token = create_refresh_token({"user_id": user.id})
    delete_all_refresh_tokens_for_user(db, user.id)
    save_refresh_token(db, refresh_token, user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
def refresh_access_token(db: Session, refresh_token: str) -> dict:
    try:
        payload = jwt.decode(
            refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    stored_token = get_refresh_token(db, refresh_token)
    if not stored_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token not found"
        )
    new_access_token = create_access_token(
        {"user_id": user_id}
    )
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }
def logout_user(db: Session, refresh_token: str) -> dict:
    stored_token = get_refresh_token(db, refresh_token)
    if not stored_token:
        raise HTTPException(
            status_code=404,
            detail="Refresh token not found"
        )
    delete_refresh_token(db, refresh_token)
    return {
        "message": "User logged out successfully"
    }