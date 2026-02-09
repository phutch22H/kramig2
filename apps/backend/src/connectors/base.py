from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TicketCount:
    total_available: int | None = None
    total_sold: int | None = None
    total_held: int | None = None
    total_capacity: int | None = None
    status: str | None = None
    raw_data: dict | None = None


@dataclass
class EventSearchResult:
    external_id: str
    name: str
    venue_name: str | None = None
    event_date: str | None = None
    url: str | None = None
    image_url: str | None = None


@dataclass
class EventDetail:
    external_id: str
    name: str
    description: str | None = None
    venue_name: str | None = None
    venue_address: str | None = None
    event_date: str | None = None
    on_sale_date: str | None = None
    url: str | None = None
    image_url: str | None = None
    artists: list[str] | None = None


@dataclass
class FinancialData:
    tickets_sold: int = 0
    gross_revenue: float = 0.0
    net_revenue: float = 0.0
    fees: float = 0.0
    refunds: float = 0.0
    refund_count: int = 0
    currency: str = "USD"
    raw_data: dict | None = None


class TicketSellerConnector(ABC):
    def __init__(self, credentials: dict):
        self.credentials = credentials

    @abstractmethod
    async def test_connection(self) -> bool:
        pass

    @abstractmethod
    async def get_ticket_counts(self, external_event_ids: list[str]) -> dict[str, TicketCount]:
        pass

    @abstractmethod
    async def search_events(self, query: str, **kwargs) -> list[EventSearchResult]:
        pass

    @abstractmethod
    async def get_event_detail(self, external_event_id: str) -> EventDetail | None:
        pass

    @abstractmethod
    async def get_financials(self, external_event_id: str) -> FinancialData | None:
        pass
