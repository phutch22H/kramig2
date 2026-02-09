import httpx

from src.config import settings


class TicketmasterClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = settings.ticketmaster_base_url
        self.inventory_url = settings.ticketmaster_inventory_url

    async def _get(self, url: str, params: dict | None = None) -> dict:
        params = params or {}
        params["apikey"] = self.api_key
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    async def test_api_key(self) -> bool:
        try:
            await self._get(f"{self.base_url}/discovery/v2/events.json", {"size": "1"})
            return True
        except (httpx.HTTPError, Exception):
            return False

    async def search_events(
        self, keyword: str, size: int = 20, page: int = 0, **kwargs
    ) -> dict:
        params = {"keyword": keyword, "size": str(size), "page": str(page)}
        params.update({k: str(v) for k, v in kwargs.items() if v is not None})
        return await self._get(f"{self.base_url}/discovery/v2/events.json", params)

    async def get_event(self, event_id: str) -> dict:
        return await self._get(f"{self.base_url}/discovery/v2/events/{event_id}.json")

    async def get_inventory_status(self, event_ids: list[str]) -> dict:
        events_param = ",".join(event_ids)
        return await self._get(
            f"{self.inventory_url}/availability",
            {"events": events_param},
        )
