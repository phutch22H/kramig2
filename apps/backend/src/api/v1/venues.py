import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, require_role
from src.models.artist import slugify
from src.models.venue import Venue
from src.schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueBulkCreate

router = APIRouter(prefix="/venues", tags=["venues"])


@router.post("", response_model=VenueResponse, status_code=201)
async def create_venue(
    body: VenueCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    slug = slugify(body.name)
    existing = await db.execute(select(Venue).where(Venue.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Venue with this name already exists")
    venue = Venue(
        name=body.name, slug=slug, address=body.address,
        city=body.city, country=body.country,
        image_url=body.image_url, capacity=body.capacity,
    )
    db.add(venue)
    await db.flush()
    return venue


@router.get("")
async def list_venues(
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor", "viewer")),
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, le=200),
):
    base = select(Venue)
    if search:
        base = base.where(
            Venue.name.ilike(f"%{search}%") | Venue.city.ilike(f"%{search}%")
        )

    count_result = await db.execute(
        select(sa_func.count()).select_from(base.with_only_columns(Venue.id).subquery())
    )
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    query = base.order_by(Venue.name.asc()).limit(page_size).offset(offset)
    result = await db.execute(query)
    items = [
        {
            "id": str(v.id), "name": v.name, "slug": v.slug,
            "address": v.address, "city": v.city, "country": v.country,
            "image_url": v.image_url, "capacity": v.capacity,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in result.scalars().all()
    ]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor", "viewer")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Venue).where(Venue.id == uuid.UUID(venue_id)))
    venue = result.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue


@router.patch("/{venue_id}", response_model=VenueResponse)
async def update_venue(
    venue_id: str,
    body: VenueUpdate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Venue).where(Venue.id == uuid.UUID(venue_id)))
    venue = result.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        data["slug"] = slugify(data["name"])
    for k, v in data.items():
        setattr(venue, k, v)
    await db.flush()
    return venue


@router.delete("/{venue_id}", status_code=204)
async def delete_venue(
    venue_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Venue).where(Venue.id == uuid.UUID(venue_id)))
    venue = result.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    await db.delete(venue)
    await db.flush()


@router.post("/bulk", status_code=201)
async def bulk_create_venues(
    body: VenueBulkCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    created = 0
    skipped = 0
    for item in body.venues:
        slug = slugify(item.name)
        if not slug:
            skipped += 1
            continue
        existing = await db.execute(select(Venue).where(Venue.slug == slug))
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        venue = Venue(
            name=item.name, slug=slug, address=item.address,
            city=item.city, country=item.country,
            image_url=item.image_url, capacity=item.capacity,
        )
        db.add(venue)
        created += 1
    await db.flush()
    return {"created": created, "skipped": skipped}
