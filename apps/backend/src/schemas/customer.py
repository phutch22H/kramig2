from datetime import datetime
from pydantic import BaseModel


class CustomerCreate(BaseModel):
    email: str
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    tags: list[str] | None = None
    notes: str | None = None
    source: str | None = None


class CustomerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    tags: list[str] | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    id: str
    org_id: str
    email: str
    first_name: str | None
    last_name: str | None
    phone: str | None
    city: str | None
    country: str | None
    tags: list[str] | None
    notes: str | None
    source: str | None
    total_events_attended: int
    total_spend: float
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerEventResponse(BaseModel):
    id: str
    event_id: str
    event_name: str | None = None
    ticket_count: int
    total_paid: float
    purchase_date: datetime | None
    source: str | None

    model_config = {"from_attributes": True}


class BulkTagRequest(BaseModel):
    customer_ids: list[str]
    tags: list[str]
    action: str = "add"  # "add" or "remove"
