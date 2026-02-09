from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from src.services.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token_value,
    get_current_user,
    register_user,
    refresh_tokens,
    revoke_refresh_token,
    store_refresh_token,
    TokenData,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, body.email, body.password, body.full_name)
    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token_value()
    await store_refresh_token(db, user.id, refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, body.email, body.password)
    access_token = create_access_token(str(user.id), user.email)
    refresh_token = create_refresh_token_value()
    await store_refresh_token(db, user.id, refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    _user, access_token, refresh_token = await refresh_tokens(db, body.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    await revoke_refresh_token(db, body.refresh_token)
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(token_data: TokenData = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from src.models.user import User

    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one()
    return UserResponse(
        id=str(user.id), email=user.email, full_name=user.full_name, is_active=user.is_active
    )
