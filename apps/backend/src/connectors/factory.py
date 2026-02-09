from src.connectors.base import TicketSellerConnector
from src.connectors.ticketmaster.connector import TicketmasterConnector

_CONNECTOR_REGISTRY: dict[str, type[TicketSellerConnector]] = {
    "ticketmaster": TicketmasterConnector,
}


def get_connector(seller_slug: str, credentials: dict) -> TicketSellerConnector:
    connector_cls = _CONNECTOR_REGISTRY.get(seller_slug)
    if not connector_cls:
        raise ValueError(f"No connector registered for seller: {seller_slug}")
    return connector_cls(credentials)


def register_connector(slug: str, connector_cls: type[TicketSellerConnector]) -> None:
    _CONNECTOR_REGISTRY[slug] = connector_cls
