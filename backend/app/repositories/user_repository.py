"""User repository: lookup and creation. Called by app.services.auth_service."""

from sqlalchemy.orm import Session
from app.models.user_model import User


# Returns the user with the given email, or None if not found (used for login / duplicate check).
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


# Creates a new user with the given name, email, and (hashed) password; commits and returns the row.
def create_user(db: Session, name: str, email: str, password: str) -> User:
    new_user = User(
        name=name,
        email=email,
        password=password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user