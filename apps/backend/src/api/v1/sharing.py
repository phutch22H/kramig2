import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, require_role
from src.models.organization import OrgShare
from src.schemas.organization import OrgShareCreate, OrgShareResponse

router = APIRouter(prefix="/sharing", tags=["sharing"])


@router.post("", response_model=OrgShareResponse, status_code=201)
async def grant_share(
    body: OrgShareCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    share = OrgShare(
        owner_org_id=ctx.org_id,
        shared_with_org_id=uuid.UUID(body.shared_with_org_id),
        resource_type=body.resource_type,
        resource_id=uuid.UUID(body.resource_id) if body.resource_id else None,
        permission=body.permission,
    )
    db.add(share)
    await db.flush()
    return OrgShareResponse(
        id=str(share.id), owner_org_id=str(share.owner_org_id),
        shared_with_org_id=str(share.shared_with_org_id),
        resource_type=share.resource_type,
        resource_id=str(share.resource_id) if share.resource_id else None,
        permission=share.permission, created_at=share.created_at,
    )


@router.get("", response_model=list[OrgShareResponse])
async def list_shares(
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgShare).where(OrgShare.owner_org_id == ctx.org_id)
    )
    return [
        OrgShareResponse(
            id=str(s.id), owner_org_id=str(s.owner_org_id),
            shared_with_org_id=str(s.shared_with_org_id),
            resource_type=s.resource_type,
            resource_id=str(s.resource_id) if s.resource_id else None,
            permission=s.permission, created_at=s.created_at,
        )
        for s in result.scalars().all()
    ]


@router.delete("/{share_id}", status_code=204)
async def revoke_share(
    share_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgShare).where(
            OrgShare.id == uuid.UUID(share_id), OrgShare.owner_org_id == ctx.org_id
        )
    )
    share = result.scalar_one_or_none()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    await db.delete(share)
