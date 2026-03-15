from sqlalchemy.orm import Session
from app.models.refresh_token_model import RefreshToken
def save_refresh_token(db: Session, token: str, user_id: int) -> RefreshToken:
    refresh = RefreshToken(
        token=token,
        user_id=user_id
    )
    db.add(refresh)
    db.commit()
    db.refresh(refresh)
    return refresh
def get_refresh_token(db: Session, token: str) -> RefreshToken | None:
    return db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).first()
def delete_refresh_token(db: Session, token: str) -> None:
    db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).delete()
    db.commit()
def delete_all_refresh_tokens_for_user(db: Session, user_id: int) -> None:
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()