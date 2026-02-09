import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, get_tenant_context, require_role
from src.models.ticket import SellerConnection, TicketSeller
from src.schemas.ticket import (
    ConnectorConnectRequest,
    ConnectorStatusResponse,
    TicketSellerResponse,
)
from src.services.encryption import encrypt_credentials, decrypt_credentials
from src.connectors.factory import get_connector

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("/sellers", response_model=list[TicketSellerResponse])
async def list_sellers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TicketSeller).where(TicketSeller.is_active == True))
    return [
        TicketSellerResponse(
            id=str(s.id), name=s.name, slug=s.slug,
            website_url=s.website_url, is_active=s.is_active,
        )
        for s in result.scalars().all()
    ]


@router.post("/connect/{seller_id}", response_model=ConnectorStatusResponse)
async def connect_seller(
    seller_id: str,
    body: ConnectorConnectRequest,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TicketSeller).where(TicketSeller.id == uuid.UUID(seller_id)))
    seller = result.scalar_one_or_none()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    creds = {"api_key": body.api_key}
    if body.api_secret:
        creds["api_secret"] = body.api_secret
    if body.extra:
        creds.update(body.extra)

    connector = get_connector(seller.slug, creds)
    test_ok = await connector.test_connection()

    existing = await db.execute(
        select(SellerConnection).where(
            SellerConnection.org_id == ctx.org_id,
            SellerConnection.seller_id == uuid.UUID(seller_id),
        )
    )
    connection = existing.scalar_one_or_none()
    if connection:
        connection.encrypted_credentials = encrypt_credentials(creds)
        connection.is_active = True
        connection.last_tested_at = datetime.now(timezone.utc)
        connection.last_test_success = test_ok
    else:
        connection = SellerConnection(
            org_id=ctx.org_id,
            seller_id=uuid.UUID(seller_id),
            encrypted_credentials=encrypt_credentials(creds),
            is_active=True,
            last_tested_at=datetime.now(timezone.utc),
            last_test_success=test_ok,
        )
        db.add(connection)
    await db.flush()

    return ConnectorStatusResponse(
        seller_id=str(seller.id), seller_name=seller.name,
        is_connected=True, is_active=True,
        last_tested_at=connection.last_tested_at,
        last_test_success=connection.last_test_success,
    )


@router.get("/status", response_model=list[ConnectorStatusResponse])
async def connector_status(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SellerConnection, TicketSeller)
        .join(TicketSeller, SellerConnection.seller_id == TicketSeller.id)
        .where(SellerConnection.org_id == ctx.org_id)
    )
    return [
        ConnectorStatusResponse(
            seller_id=str(seller.id), seller_name=seller.name,
            is_connected=True, is_active=conn.is_active,
            last_tested_at=conn.last_tested_at,
            last_test_success=conn.last_test_success,
        )
        for conn, seller in result.all()
    ]


@router.post("/test/{seller_id}", response_model=ConnectorStatusResponse)
async def test_connection(
    seller_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SellerConnection, TicketSeller)
        .join(TicketSeller, SellerConnection.seller_id == TicketSeller.id)
        .where(
            SellerConnection.org_id == ctx.org_id,
            SellerConnection.seller_id == uuid.UUID(seller_id),
        )
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")

    conn, seller = row
    creds = decrypt_credentials(conn.encrypted_credentials)
    connector = get_connector(seller.slug, creds)
    test_ok = await connector.test_connection()

    conn.last_tested_at = datetime.now(timezone.utc)
    conn.last_test_success = test_ok

    return ConnectorStatusResponse(
        seller_id=str(seller.id), seller_name=seller.name,
        is_connected=True, is_active=conn.is_active,
        last_tested_at=conn.last_tested_at,
        last_test_success=test_ok,
    )


@router.delete("/disconnect/{seller_id}", status_code=204)
async def disconnect_seller(
    seller_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SellerConnection).where(
            SellerConnection.org_id == ctx.org_id,
            SellerConnection.seller_id == uuid.UUID(seller_id),
        )
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    conn.is_active = False


@router.post("/sync/{seller_id}/events")
async def sync_events(
    seller_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    from src.tasks.poll_events import sync_seller_events
    sync_seller_events.delay(str(ctx.org_id), seller_id)
    return {"detail": "Event sync triggered"}
