import csv
import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, get_tenant_context, require_role
from src.models.customer import Customer, CustomerEvent
from src.models.event import Event
from src.schemas.customer import (
    BulkTagRequest,
    CustomerCreate,
    CustomerEventResponse,
    CustomerResponse,
    CustomerUpdate,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    body: CustomerCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Customer).where(Customer.org_id == ctx.org_id, Customer.email == body.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Customer with this email already exists")

    customer = Customer(org_id=ctx.org_id, **body.model_dump())
    db.add(customer)
    await db.flush()
    return _customer_response(customer)


@router.get("", response_model=list[CustomerResponse])
async def list_customers(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(None),
    tag: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    query = select(Customer).where(Customer.org_id == ctx.org_id)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Customer.email.ilike(pattern),
                Customer.first_name.ilike(pattern),
                Customer.last_name.ilike(pattern),
            )
        )
    if tag:
        query = query.where(Customer.tags.contains([tag]))
    query = query.order_by(Customer.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return [_customer_response(c) for c in result.scalars().all()]


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    customer = await _get_org_customer(db, ctx.org_id, customer_id)
    return _customer_response(customer)


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    body: CustomerUpdate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    customer = await _get_org_customer(db, ctx.org_id, customer_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    await db.flush()
    return _customer_response(customer)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    customer = await _get_org_customer(db, ctx.org_id, customer_id)
    await db.delete(customer)


@router.get("/{customer_id}/events", response_model=list[CustomerEventResponse])
async def customer_events(
    customer_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    await _get_org_customer(db, ctx.org_id, customer_id)
    result = await db.execute(
        select(CustomerEvent, Event)
        .join(Event, CustomerEvent.event_id == Event.id)
        .where(CustomerEvent.customer_id == uuid.UUID(customer_id))
        .order_by(CustomerEvent.purchase_date.desc().nullslast())
    )
    return [
        CustomerEventResponse(
            id=str(ce.id), event_id=str(ce.event_id), event_name=e.name,
            ticket_count=ce.ticket_count, total_paid=ce.total_paid,
            purchase_date=ce.purchase_date, source=ce.source,
        )
        for ce, e in result.all()
    ]


@router.post("/bulk-tag")
async def bulk_tag(
    body: BulkTagRequest,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    for cid in body.customer_ids:
        result = await db.execute(
            select(Customer).where(Customer.id == uuid.UUID(cid), Customer.org_id == ctx.org_id)
        )
        customer = result.scalar_one_or_none()
        if not customer:
            continue
        current_tags = list(customer.tags or [])
        if body.action == "add":
            current_tags = list(set(current_tags + body.tags))
        elif body.action == "remove":
            current_tags = [t for t in current_tags if t not in body.tags]
        customer.tags = current_tags
    return {"detail": f"Tags updated for {len(body.customer_ids)} customers"}


@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    count = 0
    for row in reader:
        email = row.get("email", "").strip()
        if not email:
            continue
        existing = await db.execute(
            select(Customer).where(Customer.org_id == ctx.org_id, Customer.email == email)
        )
        if existing.scalar_one_or_none():
            continue
        customer = Customer(
            org_id=ctx.org_id,
            email=email,
            first_name=row.get("first_name", "").strip() or None,
            last_name=row.get("last_name", "").strip() or None,
            phone=row.get("phone", "").strip() or None,
            city=row.get("city", "").strip() or None,
            country=row.get("country", "").strip() or None,
            source="csv_import",
        )
        db.add(customer)
        count += 1
    return {"detail": f"Imported {count} customers"}


@router.get("/export/csv")
async def export_csv(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Customer).where(Customer.org_id == ctx.org_id).order_by(Customer.email)
    )
    customers = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["email", "first_name", "last_name", "phone", "city", "country", "tags", "source"])
    for c in customers:
        writer.writerow([
            c.email, c.first_name or "", c.last_name or "", c.phone or "",
            c.city or "", c.country or "", ";".join(c.tags or []), c.source or "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers.csv"},
    )


async def _get_org_customer(db: AsyncSession, org_id: uuid.UUID, customer_id: str) -> Customer:
    result = await db.execute(
        select(Customer).where(Customer.id == uuid.UUID(customer_id), Customer.org_id == org_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def _customer_response(c: Customer) -> CustomerResponse:
    return CustomerResponse(
        id=str(c.id), org_id=str(c.org_id), email=c.email,
        first_name=c.first_name, last_name=c.last_name, phone=c.phone,
        city=c.city, country=c.country, tags=c.tags, notes=c.notes,
        source=c.source, total_events_attended=c.total_events_attended,
        total_spend=c.total_spend, created_at=c.created_at,
    )
