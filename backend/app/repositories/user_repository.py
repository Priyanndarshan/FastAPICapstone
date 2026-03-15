"""User repository: lookup and creation. Called by app.services.auth_service."""

from sqlalchemy.orm import Session
from app.models.user_model import User


# Returns the user with the given email, or None if not found (used for login / duplicate check).
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


# Creates a new user with the given name, email, and (hashed) password; commits and returns the row.
def create_user(db: Session, name: str, email: str, password: str, phone: str | None = None) -> User:
    new_user = User(
        name=name,
        email=email,
        password=password,
        phone=phone,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(db: Session, user_id: int, *, name: str | None = None, phone: str | None = None) -> User | None:
    """Update user profile fields; returns updated user or None if not found."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    if name is not None:
        user.name = name
    if phone is not None:
        user.phone = phone
    db.commit()
    db.refresh(user)
    return user