"""Authentication dependency (who is the current user?).

This module provides `get_current_user()`, which routers can use to protect endpoints.

## End-to-end flow (how requests get authenticated)

1) Client logs in:
   - `POST /auth/login` (handled in `app.routes.auth_routes` → `app.services.auth_service.login_user`)
   - Response includes an `access_token` (JWT).

2) Client calls a protected endpoint with the access token:
   - Example: `GET /auth/me`
   - Client must send: `Authorization: Bearer <access_token>`

3) FastAPI resolves dependencies for the endpoint:
   - `Depends(oauth2_scheme)` extracts the bearer token from the `Authorization` header.
   - `Depends(get_db)` provides a database session.

4) `get_current_user()` validates the token:
   - Decodes the JWT using `SECRET_KEY` and `ALGORITHM` from `app.utils.jwt_handler`.
   - Reads `user_id` from the token payload.
   - Queries the DB for that user (via the SQLAlchemy `Session`).

5) Endpoint receives the `User` ORM object:
   - If token is invalid/expired → 401
   - If user_id missing → 401
   - If user not found in DB → 404

## Concrete example (curl)

1) Login (form-encoded):
   curl -X POST "http://127.0.0.1:8000/auth/login" -H "Content-Type: application/x-www-form-urlencoded" ^
     -d "username=you@example.com&password=abc123"

2) Call protected endpoint:
   curl -X GET "http://127.0.0.1:8000/auth/me" -H "Authorization: Bearer <PASTE_ACCESS_TOKEN_HERE>"
"""

# Import FastAPI's dependency system (`Depends`) and exception helpers.
# - `Depends`: tells FastAPI "inject this value from another callable"
# - `HTTPException`: how you return proper HTTP errors (401/404/etc.)
# - `status`: constants like `status.HTTP_401_UNAUTHORIZED`
from fastapi import Depends, HTTPException, status

# Import the OAuth2 bearer-token helper used by Swagger UI + request parsing.
# `OAuth2PasswordBearer` reads: `Authorization: Bearer <token>`
from fastapi.security import OAuth2PasswordBearer

# Import JOSE/JWT library used to decode and validate JWT access tokens.
# - `jwt`: has `encode`/`decode`
# - `JWTError`: raised when token is invalid/expired/wrong signature, etc.
from jose import jwt, JWTError

# Import SQLAlchemy typing for DB session objects.
# We use `Session` so we can query the database for the authenticated user.
from sqlalchemy.orm import Session

# Import our SQLAlchemy `User` ORM model (maps to the `users` table).
from app.models.user_model import User

# Import the secret + algorithm used to validate tokens.
# These must match the values used when creating tokens in `app.utils.jwt_handler`.
from app.utils.jwt_handler import SECRET_KEY, ALGORITHM

# Import our DB dependency which yields a per-request SQLAlchemy session.
from app.dependencies.db_dependency import get_db


# Configure how FastAPI should extract the access token from requests.
# `tokenUrl` tells Swagger UI which endpoint to call to obtain a token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# Dependency used by protected routes to get the logged-in user.
# Any endpoint can do: `current_user: User = Depends(get_current_user)`
def get_current_user(
    # FastAPI injects the bearer token string from the `Authorization` header.
    token: str = Depends(oauth2_scheme),
    # FastAPI injects a SQLAlchemy session (created in `get_db()`).
    db: Session = Depends(get_db),
):
    # Short description for readers + docs generation tools.
    """Return the authenticated user from the Bearer access token."""

    try:
        # Decode the JWT and verify its signature + expiry.
        # If this fails, `jose` raises `JWTError` which we convert into HTTP 401.
        payload = jwt.decode(
            # The raw bearer token string (no "Bearer " prefix).
            token,
            # Secret key shared by token creation and token verification.
            SECRET_KEY,
            # Algorithms allowed for verification; must match token creation.
            algorithms=[ALGORITHM],
        )

        # Pull the application-specific user identifier from the token payload.
        user_id: int = payload.get("user_id")

        # If the token doesn't contain our expected claim, treat it as invalid.
        if user_id is None:
            raise HTTPException(
                # 401 = "you are not authenticated / token is not acceptable"
                status_code=status.HTTP_401_UNAUTHORIZED,
                # Message shown to the client in the response body.
                detail="Invalid token",
            )

    # Any JWT parsing/verification error ends up here (expired, malformed, etc.).
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    # Use the DB session to load the user record for this `user_id`.
    # Returning the ORM object lets endpoints access fields like `current_user.email`.
    user = db.query(User).filter(User.id == user_id).first()

    # Token may be valid but user could be deleted; return 404 in that case.
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # If everything is fine, return the user to the endpoint handler.
    return user