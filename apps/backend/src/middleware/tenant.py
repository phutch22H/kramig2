import uuid
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.organization import OrgMembership
from src.services.auth import get_current_user, TokenData


@dataclass
class TenantContext:
    user_id: uuid.UUID
    org_id: uuid.UUID
    role: str


async def get_tenant_context(
    x_org_id: str = Header(..., alias="X-Org-Id"),
    token_data: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    try:
        org_id = uuid.UUID(x_org_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid org ID")

    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.user_id == token_data.user_id,
            OrgMembership.org_id == org_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )

    return TenantContext(user_id=token_data.user_id, org_id=org_id, role=membership.role)


def require_role(*allowed_roles: str):
    async def check_role(ctx: TenantContext = Depends(get_tenant_context)) -> TenantContext:
        if ctx.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{ctx.role}' not permitted. Required: {', '.join(allowed_roles)}",
            )
        return ctx
    return check_role
