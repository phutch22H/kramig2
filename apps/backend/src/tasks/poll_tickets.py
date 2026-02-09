import asyncio
import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.connectors.factory import get_connector
from src.db.session import async_session_factory
from src.models.ticket import (
    EventSellerLink,
    SellerConnection,
    TicketAggregate,
    TicketSeller,
    TicketSnapshot,
)
from src.services.encryption import decrypt_credentials
from src.tasks import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="src.tasks.poll_tickets.poll_all_tickets")
def poll_all_tickets():
    asyncio.get_event_loop().run_until_complete(_poll_all_tickets())


@celery_app.task(name="src.tasks.poll_tickets.poll_event_tickets")
def poll_event_tickets(event_id: str):
    asyncio.get_event_loop().run_until_complete(_poll_event_tickets(event_id))


async def _poll_all_tickets():
    async with async_session_factory() as db:
        result = await db.execute(
            select(SellerConnection, TicketSeller)
            .join(TicketSeller, SellerConnection.seller_id == TicketSeller.id)
            .where(SellerConnection.is_active == True)
        )
        connections = result.all()

        for connection, seller in connections:
            try:
                await _poll_connection(db, connection, seller)
            except Exception:
                logger.exception(f"Failed to poll {seller.name} for org {connection.org_id}")

        await db.commit()


async def _poll_connection(db: AsyncSession, connection: SellerConnection, seller: TicketSeller):
    creds = decrypt_credentials(connection.encrypted_credentials)
    connector = get_connector(seller.slug, creds)

    links_result = await db.execute(
        select(EventSellerLink).where(
            EventSellerLink.seller_id == seller.id,
            EventSellerLink.is_active == True,
        )
    )
    links = links_result.scalars().all()
    if not links:
        return

    external_ids = [link.external_event_id for link in links]
    counts = await connector.get_ticket_counts(external_ids)
    now = datetime.now(timezone.utc)

    for link in links:
        count = counts.get(link.external_event_id)
        if not count:
            continue

        snapshot = TicketSnapshot(
            event_seller_link_id=link.id,
            total_available=count.total_available,
            total_sold=count.total_sold,
            total_held=count.total_held,
            total_capacity=count.total_capacity,
            status=count.status,
            raw_data=json.dumps(count.raw_data) if count.raw_data else None,
            polled_at=now,
        )
        db.add(snapshot)

        agg_result = await db.execute(
            select(TicketAggregate).where(
                TicketAggregate.event_id == link.event_id,
                TicketAggregate.seller_id == link.seller_id,
            )
        )
        agg = agg_result.scalar_one_or_none()
        if agg:
            agg.total_available = count.total_available or 0
            agg.total_sold = count.total_sold or 0
            agg.total_held = count.total_held or 0
            agg.total_capacity = count.total_capacity or 0
            cap = agg.total_capacity
            agg.sell_through_pct = round(agg.total_sold / cap * 100, 1) if cap > 0 else 0
            agg.last_polled_at = now
        else:
            cap = count.total_capacity or 0
            sold = count.total_sold or 0
            agg = TicketAggregate(
                event_id=link.event_id,
                seller_id=link.seller_id,
                total_available=count.total_available or 0,
                total_sold=sold,
                total_held=count.total_held or 0,
                total_capacity=cap,
                sell_through_pct=round(sold / cap * 100, 1) if cap > 0 else 0,
                last_polled_at=now,
            )
            db.add(agg)


async def _poll_event_tickets(event_id: str):
    import uuid

    async with async_session_factory() as db:
        links_result = await db.execute(
            select(EventSellerLink, TicketSeller)
            .join(TicketSeller, EventSellerLink.seller_id == TicketSeller.id)
            .where(
                EventSellerLink.event_id == uuid.UUID(event_id),
                EventSellerLink.is_active == True,
            )
        )
        links = links_result.all()

        for link, seller in links:
            conn_result = await db.execute(
                select(SellerConnection).where(
                    SellerConnection.seller_id == seller.id,
                    SellerConnection.is_active == True,
                )
            )
            connection = conn_result.scalar_one_or_none()
            if not connection:
                continue

            creds = decrypt_credentials(connection.encrypted_credentials)
            connector = get_connector(seller.slug, creds)
            counts = await connector.get_ticket_counts([link.external_event_id])
            now = datetime.now(timezone.utc)

            count = counts.get(link.external_event_id)
            if not count:
                continue

            snapshot = TicketSnapshot(
                event_seller_link_id=link.id,
                total_available=count.total_available,
                total_sold=count.total_sold,
                total_held=count.total_held,
                total_capacity=count.total_capacity,
                status=count.status,
                raw_data=json.dumps(count.raw_data) if count.raw_data else None,
                polled_at=now,
            )
            db.add(snapshot)

            agg_result = await db.execute(
                select(TicketAggregate).where(
                    TicketAggregate.event_id == link.event_id,
                    TicketAggregate.seller_id == link.seller_id,
                )
            )
            agg = agg_result.scalar_one_or_none()
            if agg:
                agg.total_available = count.total_available or 0
                agg.total_sold = count.total_sold or 0
                agg.total_held = count.total_held or 0
                agg.total_capacity = count.total_capacity or 0
                cap = agg.total_capacity
                agg.sell_through_pct = round(agg.total_sold / cap * 100, 1) if cap > 0 else 0
                agg.last_polled_at = now
            else:
                cap = count.total_capacity or 0
                sold = count.total_sold or 0
                agg = TicketAggregate(
                    event_id=link.event_id,
                    seller_id=link.seller_id,
                    total_available=count.total_available or 0,
                    total_sold=sold,
                    total_held=count.total_held or 0,
                    total_capacity=cap,
                    sell_through_pct=round(sold / cap * 100, 1) if cap > 0 else 0,
                    last_polled_at=now,
                )
                db.add(agg)

        await db.commit()
