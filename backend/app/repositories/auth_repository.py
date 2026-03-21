from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from app.models.refresh_token_model import RefreshToken


def save_refresh_token(db: Session, token: str, user_id: int) -> RefreshToken:
    try:
        refresh = RefreshToken(
            token=token,
            user_id=user_id
        )
        db.add(refresh)
        db.commit()
        db.refresh(refresh)
        return refresh

    except SQLAlchemyError:
        db.rollback()
        raise


def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    return db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).first()


def delete_refresh_token(db: Session, token: str) -> None:
    try:
        db.query(RefreshToken).filter(
            RefreshToken.token == token
        ).delete()
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise


def delete_all_refresh_tokens_for_user(db: Session, user_id: int) -> None:
    try:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id
        ).delete()
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise