from datetime import datetime
from pydantic import BaseModel


class EventCreate(BaseModel):
    name: str
    description: str | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    event_date: datetime | None = None
    doors_open: datetime | None = None
    on_sale_date: datetime | None = None
    capacity: int | None = None
    status: str = "draft"
    image_url: str | None = None
    is_public: bool = False


class EventUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    event_date: datetime | None = None
    doors_open: datetime | None = None
    on_sale_date: datetime | None = None
    capacity: int | None = None
    status: str | None = None
    image_url: str | None = None
    is_public: bool | None = None


class EventResponse(BaseModel):
    id: str
    org_id: str
    name: str
    description: str | None
    venue_name: str | None
    venue_address: str | None
    event_date: datetime | None
    doors_open: datetime | None
    on_sale_date: datetime | None
    capacity: int | None
    status: str
    image_url: str | None
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ArtistCreate(BaseModel):
    artist_name: str
    is_headliner: bool = False
    sort_order: int = 0


class ArtistResponse(BaseModel):
    id: str
    artist_name: str
    is_headliner: bool
    sort_order: int

    model_config = {"from_attributes": True}


class EventSellerLinkCreate(BaseModel):
    seller_id: str
    external_event_id: str
    external_event_url: str | None = None


class EventSellerLinkResponse(BaseModel):
    id: str
    seller_id: str
    seller_name: str | None = None
    external_event_id: str
    external_event_url: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
