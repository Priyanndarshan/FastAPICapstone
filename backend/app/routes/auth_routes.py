"""Authentication routes (HTTP endpoints).

This module defines the `/auth/*` API endpoints and wires them to the service layer.

How this connects to the rest of the code:
- Routes accept HTTP input (JSON body / form fields) and return HTTP responses.
- Most "business logic" is delegated to `app.services.auth_service`.
- DB sessions are injected using `Depends(get_db)` from `app.dependencies.db_dependency`.
- Protected endpoints use `Depends(get_current_user)` from `app.dependencies.auth_dependency`.
"""

# Import FastAPI's router and dependency injection helper.
# - `APIRouter` groups endpoints (so they can be included into the app in `app.main`).
# - `Depends` tells FastAPI to inject values (like DB session, current user, etc.).
from fastapi import APIRouter, Body, Depends

# Import SQLAlchemy Session type for type hints (represents a DB session).
from sqlalchemy.orm import Session

# Import Pydantic schemas that describe request/response shapes.
# - `UserRegister`: expected JSON body for `/auth/register`
# - `UserResponse`: response model for register endpoint
from app.schemas.user_schema import UserRegister, UserLogin, UserResponse

# Import service functions that implement the authentication logic.
# Routes should be thin; services do the heavy lifting.
from app.services.auth_service import (
    register_user,
    login_user,
    refresh_access_token,
    logout_user,
)

# Import DB dependency to get a per-request SQLAlchemy session.
from app.dependencies.db_dependency import get_db

# Import auth dependency that returns the currently authenticated user from a Bearer token.
from app.dependencies.auth_dependency import get_current_user

# Import the `User` ORM model for type hints on protected endpoints.
from app.models.user_model import User

# Import OAuth2 login form helper (expects form-encoded username/password).
# This is why `/auth/login` uses form fields, not JSON.
from fastapi.security import OAuth2PasswordRequestForm



# Create a router group:
# - `prefix="/auth"` means all routes start with `/auth`
# - `tags=[...]` groups these endpoints in Swagger UI
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserRegister,db: Session = Depends(get_db)):
    # Create a new user account.
    # - `user`: parsed from JSON body using the `UserRegister` schema
    # - `db`: injected DB session
    return register_user(db, user)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(),db: Session = Depends(get_db)):
    # Authenticate user credentials and return access + refresh tokens.
    # - `form_data`: parsed from `application/x-www-form-urlencoded`
    # - `db`: injected DB session
    return login_user(db, form_data)

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    # Return the authenticated user's profile (requires Authorization: Bearer <access_token>).
    return current_user

@router.post("/refresh")
def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    # Exchange a refresh token for a new access token.
    return refresh_access_token(db, refresh_token)


@router.post("/logout")
def logout(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    # Revoke (delete) the refresh token from DB so it can't be used again.
    return logout_user(db, refresh_token)
