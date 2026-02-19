import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import func as sa_func

from src.db.session import get_db
from src.models.artist import Artist
from src.models.event import Event, EventArtist
from src.models.organization import Organization
from src.models.ticket import EventSellerLink, TicketSeller

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/artists")
async def browse_artists(
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    letter: str | None = Query(None),
    genre: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, le=200),
):
    base = select(Artist)
    if search:
        base = base.where(Artist.name.ilike(f"%{search}%"))
    if letter and len(letter) == 1:
        base = base.where(Artist.name.ilike(f"{letter}%"))
    if genre:
        base = base.where(Artist.genre.ilike(f"%{genre}%"))

    count_result = await db.execute(
        select(sa_func.count()).select_from(base.with_only_columns(Artist.id).subquery())
    )
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    query = base.order_by(Artist.name.asc()).limit(page_size).offset(offset)
    result = await db.execute(query)
    items = [
        {"id": str(a.id), "name": a.name, "slug": a.slug, "image_url": a.image_url, "genre": a.genre, "spotify_track_url": a.spotify_track_url}
        for a in result.scalars().all()
    ]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.get("/artists/{slug}/similar")
async def similar_artists(
    slug: str,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(12, ge=1, le=50),
):
    result = await db.execute(select(Artist).where(Artist.slug == slug))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    if not artist.genre:
        return {
            "artist": {"id": str(artist.id), "name": artist.name, "slug": artist.slug, "genre": artist.genre, "image_url": artist.image_url},
            "similar": [],
        }

    from src.services.genre_affinity import get_related_genres
    related = get_related_genres(artist.genre, min_affinity=0.3)

    candidates_result = await db.execute(
        select(Artist)
        .where(Artist.genre.in_(list(related.keys())))
        .where(Artist.id != artist.id)
    )
    candidates = candidates_result.scalars().all()

    scored = []
    for c in candidates:
        affinity = related.get(c.genre, 0.0)
        scored.append({
            "id": str(c.id), "name": c.name, "slug": c.slug,
            "image_url": c.image_url, "genre": c.genre,
            "spotify_track_url": c.spotify_track_url,
            "affinity_score": round(affinity, 2),
        })

    scored.sort(key=lambda x: (-x["affinity_score"], x["name"]))

    return {
        "artist": {"id": str(artist.id), "name": artist.name, "slug": artist.slug, "genre": artist.genre, "image_url": artist.image_url},
        "similar": scored[:limit],
    }


@router.get("/artists/{slug}")
async def artist_detail(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Artist).where(Artist.slug == slug))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return {
        "id": str(artist.id), "name": artist.name, "slug": artist.slug,
        "image_url": artist.image_url, "genre": artist.genre, "spotify_track_url": artist.spotify_track_url,
    }


@router.get("/events")
async def browse_events(
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    city: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
):

    base_query = select(Event, Organization).join(Organization, Event.org_id == Organization.id).where(
        Event.is_public == True,
        Event.status == "published",
    )
    if search:
        base_query = base_query.where(Event.name.ilike(f"%{search}%"))
    if city:
        base_query = base_query.where(Event.venue_address.ilike(f"%{city}%"))

    count_result = await db.execute(
        select(sa_func.count()).select_from(
            base_query.with_only_columns(Event.id).subquery()
        )
    )
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    query = base_query.order_by(Event.event_date.asc().nullslast()).limit(page_size).offset(offset)

    result = await db.execute(query)
    items = []
    for event, org in result.all():
        items.append({
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "venue_name": event.venue_name,
            "venue_address": event.venue_address,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "image_url": event.image_url,
            "organizer": org.name,
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


@router.get("/events/{event_id}")
async def event_detail(event_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event, Organization)
        .join(Organization, Event.org_id == Organization.id)
        .where(Event.id == uuid.UUID(event_id), Event.is_public == True)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    event, org = row

    artists_result = await db.execute(
        select(EventArtist, Artist)
        .outerjoin(Artist, EventArtist.artist_id == Artist.id)
        .where(EventArtist.event_id == event.id)
        .order_by(EventArtist.sort_order)
    )
    artists = [
        {
            "name": ea.artist_name,
            "is_headliner": ea.is_headliner,
            "genre": artist.genre if artist else None,
            "spotify_track_url": artist.spotify_track_url if artist else None,
        }
        for ea, artist in artists_result.all()
    ]

    links_result = await db.execute(
        select(EventSellerLink, TicketSeller)
        .join(TicketSeller, EventSellerLink.seller_id == TicketSeller.id)
        .where(EventSellerLink.event_id == event.id, EventSellerLink.is_active == True)
    )
    buy_links = [
        {"seller": seller.name, "url": link.external_event_url}
        for link, seller in links_result.all()
        if link.external_event_url
    ]

    return {
        "id": str(event.id),
        "name": event.name,
        "description": event.description,
        "venue_name": event.venue_name,
        "venue_address": event.venue_address,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "doors_open": event.doors_open.isoformat() if event.doors_open else None,
        "image_url": event.image_url,
        "organizer": org.name,
        "artists": artists,
        "buy_links": buy_links,
    }
