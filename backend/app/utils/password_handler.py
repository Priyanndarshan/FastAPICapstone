"""Password hashing + verification helpers.

How this connects to the rest of the code:
- `app.services.auth_service.register_user()` calls `hash_password()` before saving a new user.
- `app.services.auth_service.login_user()` calls `verify_password()` to compare login input with
  the stored password hash in the database.

Why we do this:
- You should NEVER store plain-text passwords.
- Instead, store a slow, salted hash (bcrypt) and verify by hashing the input and comparing safely.
"""

# Import Passlib's `CryptContext`, a high-level API for password hashing schemes.
# It handles selecting the algorithm (bcrypt), salting, and verifying hashes.
from passlib.context import CryptContext

# Create a reusable password context configured to use bcrypt.
# - `schemes=["bcrypt"]`: hash passwords using bcrypt.
# - `deprecated="auto"`: allows algorithm upgrades/migrations if you add schemes later.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Hash a plain-text password into a bcrypt hash string for storage in the DB.
def hash_password(password: str) -> str:
    # Passlib generates a salt internally and returns the full encoded hash string.
    return pwd_context.hash(password)


# Verify that a plain-text password matches a stored bcrypt hash string.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Returns True if the password matches, otherwise False.
    return pwd_context.verify(plain_password, hashed_password)