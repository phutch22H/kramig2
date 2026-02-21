import csv
import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.middleware.tenant import TenantContext, get_tenant_context, require_role
from src.models.event import Event
from src.models.financial import FinancialReport
from src.models.ticket import TicketSeller
from src.schemas.financial import (
    FinancialReportCreate,
    FinancialReportResponse,
    FinancialReportUpdate,
    FinancialSummary,
)

router = APIRouter(prefix="/financials", tags=["financials"])


@router.get("/summary", response_model=FinancialSummary)
async def financial_summary(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    event_id: str | None = Query(None),
):
    query = (
        select(FinancialReport, Event.name, TicketSeller.name)
        .outerjoin(Event, FinancialReport.event_id == Event.id)
        .outerjoin(TicketSeller, FinancialReport.seller_id == TicketSeller.id)
        .where(FinancialReport.org_id == ctx.org_id)
    )
    if event_id:
        query = query.where(FinancialReport.event_id == uuid.UUID(event_id))
    query = query.order_by(FinancialReport.report_date.desc())

    result = await db.execute(query)
    rows = result.all()

    reports_list = [r for r, _, _ in rows]
    return FinancialSummary(
        total_gross_revenue=sum(r.gross_revenue for r in reports_list),
        total_net_revenue=sum(r.net_revenue for r in reports_list),
        total_fees=sum(r.fees for r in reports_list),
        total_refunds=sum(r.refunds for r in reports_list),
        total_tickets_sold=sum(r.tickets_sold for r in reports_list),
        reports=[_report_response(r, event_name=en, seller_name=sn) for r, en, sn in rows],
    )


@router.post("", response_model=FinancialReportResponse, status_code=201)
async def create_report(
    body: FinancialReportCreate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    report = FinancialReport(org_id=ctx.org_id, **body.model_dump())
    db.add(report)
    await db.flush()
    return _report_response(report)


@router.get("/{report_id}", response_model=FinancialReportResponse)
async def get_report(
    report_id: str,
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    report = await _get_org_report(db, ctx.org_id, report_id)
    return _report_response(report)


@router.patch("/{report_id}", response_model=FinancialReportResponse)
async def update_report(
    report_id: str,
    body: FinancialReportUpdate,
    ctx: TenantContext = Depends(require_role("owner", "admin", "editor")),
    db: AsyncSession = Depends(get_db),
):
    report = await _get_org_report(db, ctx.org_id, report_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    await db.flush()
    return _report_response(report)


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    ctx: TenantContext = Depends(require_role("owner", "admin")),
    db: AsyncSession = Depends(get_db),
):
    report = await _get_org_report(db, ctx.org_id, report_id)
    await db.delete(report)


@router.get("/settlements/pending", response_model=list[FinancialReportResponse])
async def pending_settlements(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FinancialReport).where(
            FinancialReport.org_id == ctx.org_id,
            FinancialReport.settlement_status == "pending",
        ).order_by(FinancialReport.report_date.desc())
    )
    return [_report_response(r) for r in result.scalars().all()]


@router.get("/export/csv")
async def export_financials(
    ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    event_id: str | None = Query(None),
):
    query = (
        select(FinancialReport, Event.name, TicketSeller.name)
        .outerjoin(Event, FinancialReport.event_id == Event.id)
        .outerjoin(TicketSeller, FinancialReport.seller_id == TicketSeller.id)
        .where(FinancialReport.org_id == ctx.org_id)
    )
    if event_id:
        query = query.where(FinancialReport.event_id == uuid.UUID(event_id))

    result = await db.execute(query.order_by(FinancialReport.report_date.desc()))
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "event_id", "event_name", "seller_id", "seller_name", "report_date", "tickets_sold",
        "gross_revenue", "net_revenue", "fees", "refunds", "settlement_status", "currency",
    ])
    for r, event_name, seller_name in rows:
        writer.writerow([
            str(r.event_id), event_name or "", str(r.seller_id), seller_name or "",
            r.report_date.isoformat(),
            r.tickets_sold, r.gross_revenue, r.net_revenue, r.fees, r.refunds,
            r.settlement_status, r.currency,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=financials.csv"},
    )


async def _get_org_report(db: AsyncSession, org_id: uuid.UUID, report_id: str) -> FinancialReport:
    result = await db.execute(
        select(FinancialReport).where(
            FinancialReport.id == uuid.UUID(report_id), FinancialReport.org_id == org_id
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Financial report not found")
    return report


def _report_response(
    r: FinancialReport,
    event_name: str | None = None,
    seller_name: str | None = None,
) -> FinancialReportResponse:
    return FinancialReportResponse(
        id=str(r.id), org_id=str(r.org_id), event_id=str(r.event_id),
        event_name=event_name, seller_id=str(r.seller_id),
        seller_name=seller_name, report_date=r.report_date,
        tickets_sold=r.tickets_sold, gross_revenue=r.gross_revenue,
        net_revenue=r.net_revenue, fees=r.fees, refunds=r.refunds,
        refund_count=r.refund_count, settlement_status=r.settlement_status,
        settlement_date=r.settlement_date, currency=r.currency,
        notes=r.notes, source=r.source, created_at=r.created_at,
    )
