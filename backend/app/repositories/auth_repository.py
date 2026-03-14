"""Auth repository: refresh token storage. Called by app.services.auth_service."""

from sqlalchemy.orm import Session

from app.models.refresh_token_model import RefreshToken


# Inserts a refresh token for the user; commits and returns the new RefreshToken row.
def save_refresh_token(db: Session, token: str, user_id: int) -> RefreshToken:

    refresh = RefreshToken(
        token=token,
        user_id=user_id
    )

    db.add(refresh)
    db.commit()
    db.refresh(refresh)

    return refresh


# Returns the RefreshToken row for the given token string, or None if not found.
def get_refresh_token(db: Session, token: str) -> RefreshToken | None:

    return db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).first()


# Deletes the refresh token row matching the given token and commits (used on logout/revoke).
def delete_refresh_token(db: Session, token: str) -> None:

    db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).delete()

    db.commit()