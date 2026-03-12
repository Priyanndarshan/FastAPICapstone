"""Authentication service functions (business logic).

How this connects to the rest of the code:
- `app/routes/auth_routes.py` calls these functions from the HTTP endpoints:
  - `/auth/register` → `register_user`
  - `/auth/login` → `login_user`
  - `/auth/refresh` → `refresh_access_token`
  - `/auth/logout` → `logout_user`

Why services exist:
- Routes should be thin (HTTP input/output).
- Services hold the "what should happen" logic and orchestrate:
  - DB reads/writes (via repositories)
  - password hashing/verification (via `password_handler`)
  - token creation/verification (via `jwt_handler` + `python-jose`)
"""

# Import SQLAlchemy Session type: represents a unit-of-work for DB operations.
from sqlalchemy.orm import Session

# Import FastAPI exception + status helpers:
# - `HTTPException` returns an HTTP error response (e.g. 400/401/404).
# - `status` provides named constants like `status.HTTP_400_BAD_REQUEST`.
from fastapi import HTTPException, status

# Import JWT decode + JWT error class used when validating refresh tokens.
from jose import jwt, JWTError

# Import request schema types (Pydantic models) for type hints and clarity.
from app.schemas.user_schema import UserRegister, UserLogin

# Import repository functions that directly talk to the `users` table.
from app.repositories.user_repository import (
    get_user_by_email,
    create_user,
)

# Import repository functions for storing/reading/deleting refresh tokens.
from app.repositories.auth_repository import (
    save_refresh_token,
    get_refresh_token,
    delete_refresh_token,
)

# Import password hashing utilities:
# - `hash_password` turns plain text into a secure hash for storage.
# - `verify_password` compares a plain password to a stored hash.
from app.utils.password_handler import (
    hash_password,
    verify_password,
)

# Import JWT creation helpers + verification settings used for refresh-token decoding.
from app.utils.jwt_handler import (
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM,
)



def register_user(db: Session, user_data: UserRegister):

    # Check if a user with this email already exists in the DB.
    existing_user = get_user_by_email(db, user_data.email)

    if existing_user:
        # Return a client error (400) instead of creating a duplicate account.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash the plain password before storing it (never store plain passwords).
    hashed_password = hash_password(user_data.password)

    # Create and persist the new user row in the DB.
    new_user = create_user(
        db,
        name=user_data.name,
        email=user_data.email,
        password=hashed_password
    )

    # Return the ORM user object (FastAPI converts it to the `UserResponse` schema).
    return new_user


def login_user(db, form_data):

    # OAuth2PasswordRequestForm puts the email/username in `form_data.username`.
    # Your code treats this as the email used for login.
    user = get_user_by_email(db, form_data.username)

    if not user:
        # Do not reveal whether email exists; return generic "invalid credentials".
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Verify the provided password against the stored hashed password.
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create a short-lived access token (used for Authorization: Bearer ...).
    access_token = create_access_token({"user_id": user.id})

    # Create a long-lived refresh token (used to mint new access tokens).
    refresh_token = create_refresh_token({"user_id": user.id})

    # Store refresh token in DB so it can be revoked (logout) or checked (refresh).
    # Note: as written, every login creates a new row (multiple refresh tokens per user).
    save_refresh_token(db, refresh_token, user.id)

    # Return tokens to the client.
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def refresh_access_token(db, refresh_token):

    try:
        # Decode/verify the refresh token JWT:
        # - verifies signature using SECRET_KEY
        # - verifies algorithm is allowed
        # - verifies expiry (`exp`) is not in the past
        payload = jwt.decode(
            refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Extract user_id from the token payload to issue a new access token.
        user_id = payload.get("user_id")

    except JWTError:
        # Token is invalid/expired/malformed.
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Confirm this refresh token is still stored in DB (not logged out / revoked).
    stored_token = get_refresh_token(db, refresh_token)

    if not stored_token:
        # Token might be valid cryptographically but not recognized by our system anymore.
        raise HTTPException(
            status_code=401,
            detail="Refresh token not found"
        )

    # Mint a new access token for the same user.
    new_access_token = create_access_token(
        {"user_id": user_id}
    )

    # Return only the new access token.
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


def logout_user(db, refresh_token):

    # Look up refresh token in DB to ensure it exists before deleting.
    stored_token = get_refresh_token(db, refresh_token)

    if not stored_token:
        # If it doesn't exist, client might already be logged out (or token is wrong).
        raise HTTPException(
            status_code=404,
            detail="Refresh token not found"
        )

    # Delete the refresh token row so it can no longer be used to refresh.
    delete_refresh_token(db, refresh_token)

    # Return a simple confirmation message.
    return {
        "message": "User logged out successfully"
    }