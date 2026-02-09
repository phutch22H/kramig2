from src.config import settings
from src.connectors.base import (
    EventDetail,
    EventSearchResult,
    FinancialData,
    TicketCount,
    TicketSellerConnector,
)
from src.connectors.ticketmaster.client import TicketmasterClient
from src.connectors.ticketmaster.mapper import (
    map_event_detail,
    map_inventory_status,
    map_search_results,
)


class TicketmasterConnector(TicketSellerConnector):
    def __init__(self, credentials: dict):
        super().__init__(credentials)
        self.client = TicketmasterClient(credentials["api_key"])
        self.batch_size = settings.ticketmaster_inventory_batch_size

    async def test_connection(self) -> bool:
        return await self.client.test_api_key()

    async def get_ticket_counts(self, external_event_ids: list[str]) -> dict[str, TicketCount]:
        all_results: dict[str, TicketCount] = {}
        for i in range(0, len(external_event_ids), self.batch_size):
            batch = external_event_ids[i : i + self.batch_size]
            response = await self.client.get_inventory_status(batch)
            batch_results = map_inventory_status(response, batch)
            all_results.update(batch_results)
        return all_results

    async def search_events(self, query: str, **kwargs) -> list[EventSearchResult]:
        response = await self.client.search_events(query, **kwargs)
        return map_search_results(response)

    async def get_event_detail(self, external_event_id: str) -> EventDetail | None:
        try:
            response = await self.client.get_event(external_event_id)
            return map_event_detail(response)
        except Exception:
            return None

    async def get_financials(self, external_event_id: str) -> FinancialData | None:
        # Ticketmaster Partner API financials - not available in public API
        # Would require Partner API access for real implementation
        return None
