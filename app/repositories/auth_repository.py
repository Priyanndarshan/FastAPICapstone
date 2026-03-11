from app.models.refresh_token_model import RefreshToken


def save_refresh_token(db, token, user_id):

    refresh = RefreshToken(
        token=token,
        user_id=user_id
    )

    db.add(refresh)
    db.commit()
    db.refresh(refresh)

    return refresh


def get_refresh_token(db, token):

    return db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).first()


def delete_refresh_token(db, token):

    db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).delete()

    db.commit()