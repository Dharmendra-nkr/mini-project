"""Authentication router — JWT login for managers."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import get_db
from db.models import Manager

router = APIRouter(prefix="/api/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    manager_name: str
    role: str


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiry_hours)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def get_current_manager(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> Manager:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        manager_id = int(sub)
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(Manager).where(Manager.id == manager_id))
    manager = result.scalar_one_or_none()
    if manager is None:
        raise credentials_exception
    return manager


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
):
    """Manager login with username + password."""
    result = await db.execute(select(Manager).where(Manager.email == form.username))
    manager = result.scalar_one_or_none()

    if not manager or not verify_password(form.password, manager.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token({"sub": str(manager.id), "role": manager.role})
    return TokenResponse(
        access_token=token,
        manager_name=manager.name,
        role=manager.role,
    )


@router.get("/me")
async def whoami(manager: Manager = Depends(get_current_manager)):
    """Return currently logged-in manager info."""
    return {
        "id": manager.id,
        "email": manager.email,
        "name": manager.name,
        "role": manager.role,
    }
