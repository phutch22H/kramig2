import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, get_tenant_context, require_role
from src.models.organization import OrgMembership, Organization
from src.models.user import User
from src.schemas.organization import (
    InviteRequest,
    MembershipResponse,
    OrgCreate,
    OrgResponse,
    OrgUpdate,
    RoleUpdateRequest,
)
from src.services.auth import TokenData, get_current_user

router = APIRouter(prefix="/orgs", tags=["organizations"])


@router.post("", response_model=OrgResponse, status_code=201)
async def create_org(
    body: OrgCreate,
    token_data: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org = Organization(name=body.name, type=body.type, description=body.description, logo_url=body.logo_url)
    db.add(org)
    await db.flush()

    membership = OrgMembership(org_id=org.id, user_id=token_data.user_id, role="owner")
    db.add(membership)
    await db.flush()

    return OrgResponse(
        id=str(org.id), name=org.name, type=org.type,
        description=org.description, logo_url=org.logo_url, created_at=org.created_at,
    )


@router.get("", response_model=list[OrgResponse])
async def list_orgs(
    token_data: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization)
        .join(OrgMembership)
        .where(OrgMembership.user_id == token_data.user_id)
    )
    orgs = result.scalars().all()
    return [
        OrgResponse(
            id=str(o.id), name=o.name, type=o.type,
            description=o.description, logo_url=o.logo_url, created_at=o.created_at,
        )
        for o in orgs
    ]


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(org_id: str, ctx: TenantContext = Depends(get_tenant_context), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrgResponse(
        id=str(org.id), name=org.name, type=org.type,
        description=org.description, logo_url=org.logo_url, created_at=org.created_at,
    )


@router.patch("/{org_id}", response_model=OrgResponse)
async def update_org(
    org_id: str,
    body: OrgUpdate,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    await db.flush()

    return OrgResponse(
        id=str(org.id), name=org.name, type=org.type,
        description=org.description, logo_url=org.logo_url, created_at=org.created_at,
    )


@router.delete("/{org_id}", status_code=204)
async def delete_org(
    org_id: str,
    ctx: TenantContext = Depends(require_role("owner")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    await db.delete(org)


@router.post("/{org_id}/invite", response_model=MembershipResponse, status_code=201)
async def invite_member(
    org_id: str,
    body: InviteRequest,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.execute(
        select(OrgMembership).where(
            OrgMembership.org_id == uuid.UUID(org_id),
            OrgMembership.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already a member")

    membership = OrgMembership(org_id=uuid.UUID(org_id), user_id=user.id, role=body.role)
    db.add(membership)
    await db.flush()

    return MembershipResponse(
        id=str(membership.id), user_id=str(user.id), user_email=user.email,
        user_name=user.full_name, role=membership.role, created_at=membership.created_at,
    )


@router.get("/{org_id}/members", response_model=list[MembershipResponse])
async def list_members(
    org_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgMembership, User)
        .join(User, OrgMembership.user_id == User.id)
        .where(OrgMembership.org_id == uuid.UUID(org_id))
    )
    rows = result.all()
    return [
        MembershipResponse(
            id=str(m.id), user_id=str(u.id), user_email=u.email,
            user_name=u.full_name, role=m.role, created_at=m.created_at,
        )
        for m, u in rows
    ]


@router.patch("/{org_id}/members/{user_id}/role")
async def update_member_role(
    org_id: str,
    user_id: str,
    body: RoleUpdateRequest,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.org_id == uuid.UUID(org_id),
            OrgMembership.user_id == uuid.UUID(user_id),
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    membership.role = body.role
    return {"detail": "Role updated"}


@router.delete("/{org_id}/members/{user_id}", status_code=204)
async def remove_member(
    org_id: str,
    user_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.org_id == uuid.UUID(org_id),
            OrgMembership.user_id == uuid.UUID(user_id),
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=404, detail="Membership not found")
    await db.delete(membership)
