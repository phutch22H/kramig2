import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, get_tenant_context
from src.models.event import Event
from src.models.ticket import (
    EventSellerLink,
    TicketAggregate,
    TicketSeller,
    TicketSnapshot,
)
from src.schemas.ticket import (
    TicketAggregateResponse,
    TicketDashboardSummary,
    TicketSnapshotResponse,
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/dashboard", response_model=TicketDashboardSummary)
async def dashboard_summary(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TicketAggregate, Event, TicketSeller)
        .join(Event, TicketAggregate.event_id == Event.id)
        .join(TicketSeller, TicketAggregate.seller_id == TicketSeller.id)
        .where(Event.org_id == ctx.org_id)
    )
    rows = result.all()

    total_sold = sum(a.total_sold for a, _, _ in rows)
    total_available = sum(a.total_available for a, _, _ in rows)
    total_capacity = sum(a.total_capacity for a, _, _ in rows)

    events_data = {}
    for agg, event, seller in rows:
        eid = str(event.id)
        if eid not in events_data:
            events_data[eid] = {
                "event_id": eid,
                "event_name": event.name,
                "event_date": event.event_date.isoformat() if event.event_date else None,
                "total_sold": 0,
                "total_available": 0,
                "total_capacity": 0,
                "sellers": [],
            }
        events_data[eid]["total_sold"] += agg.total_sold
        events_data[eid]["total_available"] += agg.total_available
        events_data[eid]["total_capacity"] += agg.total_capacity
        events_data[eid]["sellers"].append({
            "seller_name": seller.name,
            "total_sold": agg.total_sold,
            "total_available": agg.total_available,
        })

    return TicketDashboardSummary(
        total_events=len(events_data),
        total_sold=total_sold,
        total_available=total_available,
        total_capacity=total_capacity,
        overall_sell_through_pct=round(total_sold / total_capacity * 100, 1) if total_capacity > 0 else 0,
        events=list(events_data.values()),
    )


@router.get("/{event_id}/latest", response_model=list[TicketAggregateResponse])
async def latest_counts(
    event_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    await _check_event_access(db, ctx.org_id, event_id)
    result = await db.execute(
        select(TicketAggregate, TicketSeller)
        .join(TicketSeller, TicketAggregate.seller_id == TicketSeller.id)
        .where(TicketAggregate.event_id == uuid.UUID(event_id))
    )
    return [
        TicketAggregateResponse(
            event_id=str(agg.event_id), seller_id=str(agg.seller_id),
            seller_name=seller.name, total_available=agg.total_available,
            total_sold=agg.total_sold, total_held=agg.total_held,
            total_capacity=agg.total_capacity, sell_through_pct=agg.sell_through_pct,
            last_polled_at=agg.last_polled_at,
        )
        for agg, seller in result.all()
    ]


@router.get("/{event_id}/history", response_model=list[TicketSnapshotResponse])
async def ticket_history(
    event_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    seller_id: str | None = Query(None),
    limit: int = Query(100, le=1000),
):
    await _check_event_access(db, ctx.org_id, event_id)
    query = (
        select(TicketSnapshot)
        .join(EventSellerLink, TicketSnapshot.event_seller_link_id == EventSellerLink.id)
        .where(EventSellerLink.event_id == uuid.UUID(event_id))
    )
    if seller_id:
        query = query.where(EventSellerLink.seller_id == uuid.UUID(seller_id))
    query = query.order_by(TicketSnapshot.polled_at.desc()).limit(limit)

    result = await db.execute(query)
    return [
        TicketSnapshotResponse(
            id=str(s.id), event_seller_link_id=str(s.event_seller_link_id),
            total_available=s.total_available, total_sold=s.total_sold,
            total_held=s.total_held, total_capacity=s.total_capacity,
            status=s.status, polled_at=s.polled_at,
        )
        for s in result.scalars().all()
    ]


@router.post("/{event_id}/poll")
async def trigger_poll(
    event_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    await _check_event_access(db, ctx.org_id, event_id)
    from src.tasks.poll_tickets import poll_event_tickets
    poll_event_tickets.delay(event_id)
    return {"detail": "Poll triggered"}


async def _check_event_access(db: AsyncSession, org_id: uuid.UUID, event_id: str) -> None:
    result = await db.execute(
        select(Event).where(Event.id == uuid.UUID(event_id), Event.org_id == org_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Event not found")
