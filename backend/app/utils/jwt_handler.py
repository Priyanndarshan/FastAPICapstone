"""JWT helpers (create access + refresh tokens).

How this connects to the rest of the code:
- `app.services.auth_service.login_user()` calls `create_access_token()` and `create_refresh_token()`.
- `app.dependencies.auth_dependency.get_current_user()` decodes/validates access tokens using
  the same `SECRET_KEY` and `ALGORITHM` values defined here.

What is a JWT?
- A JWT is a signed string containing a JSON payload (claims). Your app uses it to carry `user_id`
  plus an expiry claim `exp`.

Concrete example:
- Input data: `{"user_id": 123}`
- Output: a long string like `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Client sends it as: `Authorization: Bearer <token>`
"""

# Import the JOSE/JWT library used to encode (and elsewhere decode) JWT tokens.
from datetime import datetime, timedelta

from jose import jwt

from app.config import settings

# Re-export config values so existing imports keep working.
SECRET_KEY: str = settings.SECRET_KEY
ALGORITHM: str = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS: int = settings.REFRESH_TOKEN_EXPIRE_DAYS


# Create a short-lived access token containing the provided payload data (e.g. user_id).
def create_access_token(data: dict) -> str:
    # Copy the incoming payload so we don't mutate the caller's dict.
    to_encode = data.copy()

    # Compute the expiry timestamp (UTC) by adding minutes.
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add the standard JWT "exp" (expiry) claim; libraries enforce it during decode.
    to_encode.update({"exp": expire})

    # Encode/sign the JWT string using the secret and algorithm.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    # Return the signed JWT string to the caller (sent back to the client).
    return encoded_jwt


# Create a longer-lived refresh token containing the provided payload data (e.g. user_id).
def create_refresh_token(data: dict) -> str:
    # Copy the incoming payload so we don't mutate the caller's dict.
    to_encode = data.copy()

    # Compute the expiry timestamp (UTC) by adding days.
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    # Add the standard JWT "exp" (expiry) claim.
    to_encode.update({"exp": expire})

    # Encode/sign and return the JWT refresh token string.
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)