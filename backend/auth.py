"""
Authentication: password hashing, JWT tokens, and "who is asking?".

Passwords are NEVER stored. We store a PBKDF2-SHA256 hash with a random
salt (Python standard library - no fragile native dependencies).
"""
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend import config
from backend.database import get_db
from backend.models import User

_ALGO = "HS256"
_ITERATIONS = 120_000

bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Passwords
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Returns 'salt$hash'. The salt is random, so two students with the
    same password still get completely different stored values."""
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS
    ).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS
    ).hex()
    # compare_digest avoids leaking information through timing
    return hmac.compare_digest(digest, expected)


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------
def create_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.TOKEN_EXPIRY_HOURS),
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm=_ALGO)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency. Any route that declares this argument is
    automatically protected - and receives the logged-in User object.

    This is why a ride's creator is always trustworthy: it comes from the
    signed token, never from whatever the browser claimed in the body."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not logged in. Please sign in again.",
    )
    if creds is None:
        raise unauthorized
    try:
        payload = jwt.decode(creds.credentials, config.SECRET_KEY, algorithms=[_ALGO])
        user_id = int(payload["sub"])
    except Exception:
        raise unauthorized

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise unauthorized
    return user


# ---------------------------------------------------------------------------
# College verification - the trust layer
# ---------------------------------------------------------------------------
def check_college_email(email: str) -> None:
    """Raises 400 unless the email belongs to an allowed college domain.

    This is what makes RidePair a closed, verified campus network rather
    than a public ride-hailing app."""
    if not config.ENFORCE_COLLEGE_EMAIL:
        return
    domain = email.split("@")[-1].lower().strip()
    if domain not in [d.lower() for d in config.ALLOWED_EMAIL_DOMAINS]:
        allowed = ", ".join("@" + d for d in config.ALLOWED_EMAIL_DOMAINS)
        raise HTTPException(
            status_code=400,
            detail=f"RidePair is open only to verified students. Use your college email ({allowed}).",
        )
