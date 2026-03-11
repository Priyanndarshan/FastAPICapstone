from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user_schema import UserRegister, UserLogin, UserResponse
from app.services.auth_service import register_user, login_user,refresh_access_token,logout_user
from app.dependencies.db_dependency import get_db
from app.dependencies.auth_dependency import get_current_user
from app.models.user_model import User
from jose import jwt, JWTError
from app.utils.jwt_handler import SECRET_KEY, ALGORITHM, create_access_token
from fastapi.security import OAuth2PasswordRequestForm



router = APIRouter(prefix="/auth",tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserRegister,db: Session = Depends(get_db)):
    return register_user(db, user)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(),db: Session = Depends(get_db)):
    return login_user(db, form_data)

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/refresh")
def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    return refresh_access_token(db, refresh_token)


@router.post("/logout")
def logout(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    return logout_user(db, refresh_token)
