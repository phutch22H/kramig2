import asyncio
import logging

from src.tasks import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="src.tasks.poll_events.sync_seller_events")
def sync_seller_events(org_id: str, seller_id: str):
    asyncio.get_event_loop().run_until_complete(_sync_seller_events(org_id, seller_id))


async def _sync_seller_events(org_id: str, seller_id: str):
    import uuid
    from sqlalchemy import select
    from src.db.session import async_session_factory
    from src.models.ticket import SellerConnection, TicketSeller
    from src.services.encryption import decrypt_credentials
    from src.connectors.factory import get_connector

    async with async_session_factory() as db:
        result = await db.execute(
            select(SellerConnection, TicketSeller)
            .join(TicketSeller, SellerConnection.seller_id == TicketSeller.id)
            .where(
                SellerConnection.org_id == uuid.UUID(org_id),
                SellerConnection.seller_id == uuid.UUID(seller_id),
                SellerConnection.is_active == True,
            )
        )
        row = result.one_or_none()
        if not row:
            logger.warning(f"No active connection for org={org_id} seller={seller_id}")
            return

        connection, seller = row
        creds = decrypt_credentials(connection.encrypted_credentials)
        connector = get_connector(seller.slug, creds)

        events = await connector.search_events("")
        logger.info(f"Found {len(events)} events from {seller.name} for org {org_id}")
        await db.commit()
