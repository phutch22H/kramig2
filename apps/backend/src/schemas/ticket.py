from datetime import datetime
from pydantic import BaseModel


class TicketAggregateResponse(BaseModel):
    event_id: str
    seller_id: str
    seller_name: str | None = None
    total_available: int
    total_sold: int
    total_held: int
    total_capacity: int
    sell_through_pct: float
    last_polled_at: datetime | None

    model_config = {"from_attributes": True}


class TicketSnapshotResponse(BaseModel):
    id: str
    event_seller_link_id: str
    total_available: int | None
    total_sold: int | None
    total_held: int | None
    total_capacity: int | None
    status: str | None
    polled_at: datetime

    model_config = {"from_attributes": True}


class TicketDashboardSummary(BaseModel):
    total_events: int
    total_sold: int
    total_available: int
    total_capacity: int
    overall_sell_through_pct: float
    events: list[dict]


class TicketSellerResponse(BaseModel):
    id: str
    name: str
    slug: str
    website_url: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class TicketSellerCreate(BaseModel):
    name: str
    slug: str
    website_url: str | None = None


class ConnectorConnectRequest(BaseModel):
    api_key: str
    api_secret: str | None = None
    extra: dict | None = None


class ConnectorStatusResponse(BaseModel):
    seller_id: str
    seller_name: str
    is_connected: bool
    is_active: bool
    last_tested_at: datetime | None
    last_test_success: bool | None
