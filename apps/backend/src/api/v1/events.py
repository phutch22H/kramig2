import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, get_tenant_context, require_role
from src.models.artist import Artist, slugify
from src.models.event import Event, EventArtist
from src.models.ticket import EventSellerLink, TicketSeller
from src.schemas.event import (
    ArtistCreate,
    ArtistResponse,
    EventCreate,
    EventResponse,
    EventSellerLinkCreate,
    EventSellerLinkResponse,
    EventUpdate,
)

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    body: EventCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    event = Event(org_id=ctx.org_id, **body.model_dump())
    db.add(event)
    await db.flush()
    return _event_response(event)


@router.get("", response_model=list[EventResponse])
async def list_events(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    query = select(Event).where(Event.org_id == ctx.org_id)
    if status:
        query = query.where(Event.status == status)
    query = query.order_by(Event.event_date.desc().nullslast()).limit(limit).offset(offset)
    result = await db.execute(query)
    return [_event_response(e) for e in result.scalars().all()]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    event = await _get_org_event(db, ctx.org_id, event_id)
    return _event_response(event)


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    body: EventUpdate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    event = await _get_org_event(db, ctx.org_id, event_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    await db.flush()
    return _event_response(event)


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    event = await _get_org_event(db, ctx.org_id, event_id)
    await db.delete(event)


# --- Artists ---

@router.post("/{event_id}/artists", response_model=ArtistResponse, status_code=201)
async def add_artist(
    event_id: str,
    body: ArtistCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_event(db, ctx.org_id, event_id)

    directory_artist: Artist | None = None

    # Link to Artist directory
    if body.artist_id:
        result = await db.execute(select(Artist).where(Artist.id == uuid.UUID(body.artist_id)))
        directory_artist = result.scalar_one_or_none()
    else:
        # Try to find by name in directory
        result = await db.execute(select(Artist).where(Artist.name.ilike(body.artist_name)))
        directory_artist = result.scalar_one_or_none()
        if not directory_artist:
            # Create new artist in directory
            slug = slugify(body.artist_name)
            if slug:
                directory_artist = Artist(name=body.artist_name, slug=slug)
                db.add(directory_artist)
                await db.flush()

    # Fetch Spotify URL if not already set
    if directory_artist and not directory_artist.spotify_track_url:
        try:
            from src.services.spotify import get_top_track_url
            url = await get_top_track_url(directory_artist.name)
            if url:
                directory_artist.spotify_track_url = url
                await db.flush()
        except Exception:
            pass

    event_artist = EventArtist(
        event_id=uuid.UUID(event_id),
        artist_id=directory_artist.id if directory_artist else None,
        artist_name=directory_artist.name if directory_artist else body.artist_name,
        is_headliner=body.is_headliner,
        sort_order=body.sort_order,
    )
    db.add(event_artist)
    await db.flush()

    return ArtistResponse(
        id=str(event_artist.id),
        artist_name=event_artist.artist_name,
        artist_id=str(directory_artist.id) if directory_artist else None,
        is_headliner=event_artist.is_headliner,
        sort_order=event_artist.sort_order,
        genre=directory_artist.genre if directory_artist else None,
        spotify_track_url=directory_artist.spotify_track_url if directory_artist else None,
    )


@router.get("/{event_id}/artists", response_model=list[ArtistResponse])
async def list_artists(
    event_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_event(db, ctx.org_id, event_id)
    result = await db.execute(
        select(EventArtist, Artist)
        .outerjoin(Artist, EventArtist.artist_id == Artist.id)
        .where(EventArtist.event_id == uuid.UUID(event_id))
        .order_by(EventArtist.sort_order)
    )
    return [
        ArtistResponse(
            id=str(ea.id), artist_name=ea.artist_name,
            artist_id=str(ea.artist_id) if ea.artist_id else None,
            is_headliner=ea.is_headliner, sort_order=ea.sort_order,
            genre=artist.genre if artist else None,
            spotify_track_url=artist.spotify_track_url if artist else None,
        )
        for ea, artist in result.all()
    ]


@router.delete("/{event_id}/artists/{artist_id}", status_code=204)
async def remove_artist(
    event_id: str, artist_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_event(db, ctx.org_id, event_id)
    result = await db.execute(select(EventArtist).where(EventArtist.id == uuid.UUID(artist_id)))
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    await db.delete(artist)


# --- Seller Links ---

@router.post("/{event_id}/sellers", response_model=EventSellerLinkResponse, status_code=201)
async def link_seller(
    event_id: str,
    body: EventSellerLinkCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_event(db, ctx.org_id, event_id)
    link = EventSellerLink(
        event_id=uuid.UUID(event_id),
        seller_id=uuid.UUID(body.seller_id),
        external_event_id=body.external_event_id,
        external_event_url=body.external_event_url,
    )
    db.add(link)
    await db.flush()

    result = await db.execute(select(TicketSeller).where(TicketSeller.id == uuid.UUID(body.seller_id)))
    seller = result.scalar_one_or_none()

    return EventSellerLinkResponse(
        id=str(link.id), seller_id=str(link.seller_id),
        seller_name=seller.name if seller else None,
        external_event_id=link.external_event_id,
        external_event_url=link.external_event_url,
        is_active=link.is_active, created_at=link.created_at,
    )


@router.get("/{event_id}/sellers", response_model=list[EventSellerLinkResponse])
async def list_seller_links(
    event_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_event(db, ctx.org_id, event_id)
    result = await db.execute(
        select(EventSellerLink, TicketSeller)
        .join(TicketSeller, EventSellerLink.seller_id == TicketSeller.id)
        .where(EventSellerLink.event_id == uuid.UUID(event_id))
    )
    return [
        EventSellerLinkResponse(
            id=str(link.id), seller_id=str(link.seller_id), seller_name=seller.name,
            external_event_id=link.external_event_id, external_event_url=link.external_event_url,
            is_active=link.is_active, created_at=link.created_at,
        )
        for link, seller in result.all()
    ]


@router.delete("/{event_id}/sellers/{link_id}", status_code=204)
async def unlink_seller(
    event_id: str, link_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_event(db, ctx.org_id, event_id)
    result = await db.execute(select(EventSellerLink).where(EventSellerLink.id == uuid.UUID(link_id)))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Seller link not found")
    await db.delete(link)


async def _get_org_event(db: AsyncSession, org_id: uuid.UUID, event_id: str) -> Event:
    result = await db.execute(
        select(Event).where(Event.id == uuid.UUID(event_id), Event.org_id == org_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _event_response(event: Event) -> EventResponse:
    return EventResponse(
        id=str(event.id), org_id=str(event.org_id), name=event.name,
        description=event.description, venue_name=event.venue_name,
        venue_address=event.venue_address, event_date=event.event_date,
        doors_open=event.doors_open, on_sale_date=event.on_sale_date,
        capacity=event.capacity, status=event.status, image_url=event.image_url,
        is_public=event.is_public, created_at=event.created_at,
    )
