import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class TicketSeller(Base):
    __tablename__ = "ticket_sellers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class SellerConnection(Base):
    __tablename__ = "seller_connections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ticket_sellers.id", ondelete="CASCADE"), nullable=False
    )
    encrypted_credentials: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    last_tested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_test_success: Mapped[bool | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    seller: Mapped["TicketSeller"] = relationship()


class EventSellerLink(Base):
    __tablename__ = "event_seller_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ticket_sellers.id", ondelete="CASCADE"), nullable=False
    )
    external_event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    external_event_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    event: Mapped["Event"] = relationship(back_populates="seller_links")
    seller: Mapped["TicketSeller"] = relationship()


class TicketSnapshot(Base):
    __tablename__ = "ticket_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_seller_link_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("event_seller_links.id", ondelete="CASCADE"), nullable=False, index=True
    )
    total_available: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_sold: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_held: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    raw_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    polled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class TicketAggregate(Base):
    __tablename__ = "ticket_aggregates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ticket_sellers.id", ondelete="CASCADE"), nullable=False
    )
    total_available: Mapped[int] = mapped_column(Integer, default=0)
    total_sold: Mapped[int] = mapped_column(Integer, default=0)
    total_held: Mapped[int] = mapped_column(Integer, default=0)
    total_capacity: Mapped[int] = mapped_column(Integer, default=0)
    sell_through_pct: Mapped[float] = mapped_column(Float, default=0.0)
    last_polled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


from src.models.event import Event  # noqa: E402
