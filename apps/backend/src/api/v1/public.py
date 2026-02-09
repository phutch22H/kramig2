import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.models.event import Event, EventArtist
from src.models.organization import Organization
from src.models.ticket import EventSellerLink, TicketSeller

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/events")
async def browse_events(
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    city: str | None = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    query = select(Event, Organization).join(Organization, Event.org_id == Organization.id).where(
        Event.is_public == True,
        Event.status == "published",
    )
    if search:
        query = query.where(Event.name.ilike(f"%{search}%"))
    if city:
        query = query.where(Event.venue_address.ilike(f"%{city}%"))
    query = query.order_by(Event.event_date.asc().nullslast()).limit(limit).offset(offset)

    result = await db.execute(query)
    events = []
    for event, org in result.all():
        events.append({
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "venue_name": event.venue_name,
            "venue_address": event.venue_address,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "image_url": event.image_url,
            "organizer": org.name,
        })
    return {"events": events, "count": len(events)}


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
        select(EventArtist).where(EventArtist.event_id == event.id).order_by(EventArtist.sort_order)
    )
    artists = [
        {"name": a.artist_name, "is_headliner": a.is_headliner}
        for a in artists_result.scalars().all()
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
