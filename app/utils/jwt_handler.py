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
from jose import jwt

# Import date/time helpers to calculate token expiry timestamps.
from datetime import datetime, timedelta


# Secret used to sign JWTs (must be the same for encoding + decoding).
# In production you should store this in an environment variable, not in code.
SECRET_KEY = "supersecretkey"

# The signing algorithm used for JWTs.
# HS256 = HMAC-SHA256 (symmetric key: same secret for sign and verify).
ALGORITHM = "HS256"

# Access tokens are short-lived (used to call protected APIs like `/auth/me`).
ACCESS_TOKEN_EXPIRE_HOURS = 1

# Refresh tokens are longer-lived (used to mint new access tokens via `/auth/refresh`).
REFRESH_TOKEN_EXPIRE_DAYS = 7


# Create a short-lived access token containing the provided payload data (e.g. user_id).
def create_access_token(data: dict):
    # Copy the incoming payload so we don't mutate the caller's dict.
    to_encode = data.copy()

    # Compute the expiry timestamp (UTC) by adding hours.
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    # Add the standard JWT "exp" (expiry) claim; libraries enforce it during decode.
    to_encode.update({"exp": expire})

    # Encode/sign the JWT string using the secret and algorithm.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    # Return the signed JWT string to the caller (sent back to the client).
    return encoded_jwt


# Create a longer-lived refresh token containing the provided payload data (e.g. user_id).
def create_refresh_token(data: dict):
    # Copy the incoming payload so we don't mutate the caller's dict.
    to_encode = data.copy()

    # Compute the expiry timestamp (UTC) by adding days.
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    # Add the standard JWT "exp" (expiry) claim.
    to_encode.update({"exp": expire})

    # Encode/sign and return the JWT refresh token string.
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)