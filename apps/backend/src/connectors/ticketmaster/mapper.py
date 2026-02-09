from src.connectors.base import EventDetail, EventSearchResult, TicketCount


def map_search_results(api_response: dict) -> list[EventSearchResult]:
    embedded = api_response.get("_embedded", {})
    events = embedded.get("events", [])
    results = []
    for e in events:
        dates = e.get("dates", {}).get("start", {})
        images = e.get("images", [])
        image_url = images[0]["url"] if images else None

        results.append(EventSearchResult(
            external_id=e["id"],
            name=e.get("name", ""),
            venue_name=_get_venue_name(e),
            event_date=dates.get("dateTime") or dates.get("localDate"),
            url=e.get("url"),
            image_url=image_url,
        ))
    return results


def map_event_detail(data: dict) -> EventDetail:
    dates = data.get("dates", {}).get("start", {})
    sales = data.get("sales", {}).get("public", {})
    images = data.get("images", [])
    image_url = images[0]["url"] if images else None

    artists = []
    for attraction in data.get("_embedded", {}).get("attractions", []):
        artists.append(attraction.get("name", ""))

    venue_name = _get_venue_name(data)
    venue_address = _get_venue_address(data)

    return EventDetail(
        external_id=data["id"],
        name=data.get("name", ""),
        description=data.get("info") or data.get("pleaseNote"),
        venue_name=venue_name,
        venue_address=venue_address,
        event_date=dates.get("dateTime") or dates.get("localDate"),
        on_sale_date=sales.get("startDateTime"),
        url=data.get("url"),
        image_url=image_url,
        artists=artists,
    )


def map_inventory_status(api_response: dict, event_ids: list[str]) -> dict[str, TicketCount]:
    results = {}
    events_data = api_response if isinstance(api_response, list) else api_response.get("events", [])

    for item in events_data:
        eid = item.get("eventId") or item.get("id", "")
        if eid not in event_ids:
            continue
        status = item.get("status", "")
        counts = item.get("counts", {})

        results[eid] = TicketCount(
            total_available=counts.get("available"),
            total_sold=counts.get("sold"),
            total_held=counts.get("held"),
            total_capacity=counts.get("capacity"),
            status=status,
            raw_data=item,
        )

    return results


def _get_venue_name(event_data: dict) -> str | None:
    venues = event_data.get("_embedded", {}).get("venues", [])
    if venues:
        return venues[0].get("name")
    return None


def _get_venue_address(event_data: dict) -> str | None:
    venues = event_data.get("_embedded", {}).get("venues", [])
    if not venues:
        return None
    venue = venues[0]
    parts = []
    addr = venue.get("address", {})
    if addr.get("line1"):
        parts.append(addr["line1"])
    city = venue.get("city", {})
    if city.get("name"):
        parts.append(city["name"])
    state = venue.get("state", {})
    if state.get("stateCode"):
        parts.append(state["stateCode"])
    country = venue.get("country", {})
    if country.get("countryCode"):
        parts.append(country["countryCode"])
    return ", ".join(parts) if parts else None
