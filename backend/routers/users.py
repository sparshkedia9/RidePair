"""
Authentication routes: signup, login, and "who am I".
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend import config
from backend.auth import (
    check_college_email,
    create_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import get_db
from backend.models import User
from backend.schemas import LoginIn, SignupIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _out(user: User) -> UserOut:
    data = UserOut.model_validate(user)
    data.initials = user.initials
    return data


@router.post("/signup", response_model=TokenOut, status_code=201)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    # The trust layer: only verified college students get in.
    check_college_email(email)

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "That email is already registered. Try logging in.")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        college=config.COLLEGE_NAME,
        phone=payload.phone.strip(),
        gender=payload.gender,
        class_year=payload.class_year,
        major=payload.major,
        dorm=payload.dorm,
        share_contact_on_match=payload.share_contact_on_match,
        rating=5.0,
        rides_hosted=0,
        reviews_count=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenOut(access_token=create_token(user), user=_out(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Same message for both cases, so nobody can probe which emails exist.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password.")

    return TokenOut(access_token=create_token(user), user=_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _out(user)
