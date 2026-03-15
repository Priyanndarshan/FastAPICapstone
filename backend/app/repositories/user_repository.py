from sqlalchemy.orm import Session
from app.models.user_model import User
_UNSET = object()
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()
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
def update_user(
    db: Session,
    user_id: int,
    *,
    name: str | None | type[_UNSET] = _UNSET,
    phone: str | None | type[_UNSET] = _UNSET,
) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    if name is not _UNSET:
        user.name = name
    if phone is not _UNSET:
        user.phone = phone
    db.commit()
    db.refresh(user)
    return user