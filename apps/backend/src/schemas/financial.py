from datetime import datetime
from pydantic import BaseModel


class FinancialReportCreate(BaseModel):
    event_id: str
    seller_id: str
    report_date: datetime
    tickets_sold: int = 0
    gross_revenue: float = 0.0
    net_revenue: float = 0.0
    fees: float = 0.0
    refunds: float = 0.0
    refund_count: int = 0
    settlement_status: str = "pending"
    settlement_date: datetime | None = None
    currency: str = "USD"
    notes: str | None = None
    source: str = "manual"


class FinancialReportUpdate(BaseModel):
    tickets_sold: int | None = None
    gross_revenue: float | None = None
    net_revenue: float | None = None
    fees: float | None = None
    refunds: float | None = None
    refund_count: int | None = None
    settlement_status: str | None = None
    settlement_date: datetime | None = None
    notes: str | None = None


class FinancialReportResponse(BaseModel):
    id: str
    org_id: str
    event_id: str
    seller_id: str
    report_date: datetime
    tickets_sold: int
    gross_revenue: float
    net_revenue: float
    fees: float
    refunds: float
    refund_count: int
    settlement_status: str
    settlement_date: datetime | None
    currency: str
    notes: str | None
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FinancialSummary(BaseModel):
    total_gross_revenue: float
    total_net_revenue: float
    total_fees: float
    total_refunds: float
    total_tickets_sold: int
    reports: list[FinancialReportResponse]
