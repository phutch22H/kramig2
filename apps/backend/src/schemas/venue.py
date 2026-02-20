from datetime import datetime
from pydantic import BaseModel


class VenueCreate(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    country: str | None = None
    image_url: str | None = None
    capacity: int | None = None


class VenueUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    image_url: str | None = None
    capacity: int | None = None


class VenueResponse(BaseModel):
    id: str
    name: str
    slug: str
    address: str | None
    city: str | None
    country: str | None
    image_url: str | None
    capacity: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VenueBulkCreate(BaseModel):
    venues: list[VenueCreate]
