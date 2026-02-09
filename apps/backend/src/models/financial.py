import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class FinancialReport(Base):
    __tablename__ = "financial_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ticket_sellers.id", ondelete="CASCADE"), nullable=False
    )
    report_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    tickets_sold: Mapped[int] = mapped_column(Integer, default=0)
    gross_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    net_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    fees: Mapped[float] = mapped_column(Float, default=0.0)
    refunds: Mapped[float] = mapped_column(Float, default=0.0)
    refund_count: Mapped[int] = mapped_column(Integer, default=0)
    settlement_status: Mapped[str] = mapped_column(String(50), default="pending")
    settlement_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="manual")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    event: Mapped["Event"] = relationship()
    seller: Mapped["TicketSeller"] = relationship()


from src.models.event import Event  # noqa: E402
from src.models.ticket import TicketSeller  # noqa: E402
