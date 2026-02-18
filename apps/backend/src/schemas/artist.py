from datetime import datetime
from pydantic import BaseModel


class ArtistCreate(BaseModel):
    name: str
    image_url: str | None = None
    genre: str | None = None


class ArtistUpdate(BaseModel):
    name: str | None = None
    image_url: str | None = None
    genre: str | None = None


class ArtistResponse(BaseModel):
    id: str
    name: str
    slug: str
    image_url: str | None
    genre: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ArtistBulkCreate(BaseModel):
    artists: list[ArtistCreate]
