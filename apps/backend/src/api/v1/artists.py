import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, require_role
from src.models.artist import Artist, slugify
from src.schemas.artist import ArtistCreate, ArtistUpdate, ArtistResponse, ArtistBulkCreate

router = APIRouter(prefix="/artists", tags=["artists"])


@router.post("", response_model=ArtistResponse, status_code=201)
async def create_artist(
    body: ArtistCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    slug = slugify(body.name)
    existing = await db.execute(select(Artist).where(Artist.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Artist with this name already exists")
    artist = Artist(name=body.name, slug=slug, image_url=body.image_url, genre=body.genre)
    db.add(artist)
    await db.flush()
    return artist


@router.get("")
async def list_artists(
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor", "viewer")),
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, le=200),
):
    base = select(Artist)
    if search:
        base = base.where(Artist.name.ilike(f"%{search}%"))

    count_result = await db.execute(
        select(sa_func.count()).select_from(base.with_only_columns(Artist.id).subquery())
    )
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    query = base.order_by(Artist.name.asc()).limit(page_size).offset(offset)
    result = await db.execute(query)
    items = [
        {
            "id": str(a.id), "name": a.name, "slug": a.slug,
            "image_url": a.image_url, "genre": a.genre,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in result.scalars().all()
    ]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.get("/{artist_id}", response_model=ArtistResponse)
async def get_artist(
    artist_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor", "viewer")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Artist).where(Artist.id == uuid.UUID(artist_id)))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist


@router.patch("/{artist_id}", response_model=ArtistResponse)
async def update_artist(
    artist_id: str,
    body: ArtistUpdate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Artist).where(Artist.id == uuid.UUID(artist_id)))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        data["slug"] = slugify(data["name"])
    for k, v in data.items():
        setattr(artist, k, v)
    await db.flush()
    return artist


@router.delete("/{artist_id}", status_code=204)
async def delete_artist(
    artist_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Artist).where(Artist.id == uuid.UUID(artist_id)))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    await db.delete(artist)
    await db.flush()


@router.post("/bulk", status_code=201)
async def bulk_create_artists(
    body: ArtistBulkCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    created = 0
    skipped = 0
    for item in body.artists:
        slug = slugify(item.name)
        if not slug:
            skipped += 1
            continue
        existing = await db.execute(select(Artist).where(Artist.slug == slug))
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        artist = Artist(name=item.name, slug=slug, image_url=item.image_url, genre=item.genre)
        db.add(artist)
        created += 1
    await db.flush()
    return {"created": created, "skipped": skipped}
