import pytest

from src.connectors.base import TicketCount, EventSearchResult, EventDetail
from src.connectors.ticketmaster.mapper import (
    map_search_results,
    map_event_detail,
    map_inventory_status,
)


def test_map_search_results():
    api_response = {
        "_embedded": {
            "events": [
                {
                    "id": "TM123",
                    "name": "Rock Concert",
                    "dates": {"start": {"dateTime": "2025-06-15T20:00:00Z"}},
                    "images": [{"url": "https://img.example.com/concert.jpg"}],
                    "_embedded": {
                        "venues": [{"name": "Madison Square Garden"}]
                    },
                    "url": "https://ticketmaster.com/event/TM123",
                }
            ]
        }
    }
    results = map_search_results(api_response)
    assert len(results) == 1
    assert results[0].external_id == "TM123"
    assert results[0].name == "Rock Concert"
    assert results[0].venue_name == "Madison Square Garden"


def test_map_search_results_empty():
    assert map_search_results({}) == []
    assert map_search_results({"_embedded": {}}) == []


def test_map_event_detail():
    data = {
        "id": "TM456",
        "name": "Jazz Night",
        "info": "An evening of jazz",
        "dates": {"start": {"dateTime": "2025-07-20T19:00:00Z"}},
        "sales": {"public": {"startDateTime": "2025-05-01T10:00:00Z"}},
        "images": [{"url": "https://img.example.com/jazz.jpg"}],
        "url": "https://ticketmaster.com/event/TM456",
        "_embedded": {
            "venues": [
                {
                    "name": "Blue Note",
                    "address": {"line1": "131 W 3rd St"},
                    "city": {"name": "New York"},
                    "state": {"stateCode": "NY"},
                    "country": {"countryCode": "US"},
                }
            ],
            "attractions": [
                {"name": "Miles Davis Tribute"},
                {"name": "John Coltrane Band"},
            ],
        },
    }
    detail = map_event_detail(data)
    assert detail.external_id == "TM456"
    assert detail.name == "Jazz Night"
    assert detail.venue_name == "Blue Note"
    assert "131 W 3rd St" in detail.venue_address
    assert len(detail.artists) == 2


def test_map_inventory_status():
    api_response = {
        "events": [
            {
                "eventId": "TM123",
                "status": "onsale",
                "counts": {
                    "available": 3000,
                    "sold": 2000,
                    "held": 500,
                    "capacity": 5500,
                },
            },
            {
                "eventId": "TM456",
                "status": "onsale",
                "counts": {
                    "available": 100,
                    "sold": 900,
                    "held": 0,
                    "capacity": 1000,
                },
            },
        ]
    }
    results = map_inventory_status(api_response, ["TM123", "TM456"])
    assert len(results) == 2
    assert results["TM123"].total_sold == 2000
    assert results["TM123"].total_available == 3000
    assert results["TM456"].total_capacity == 1000


def test_map_inventory_status_filters_unknown():
    api_response = {
        "events": [
            {"eventId": "TM999", "status": "onsale", "counts": {"sold": 100}},
        ]
    }
    results = map_inventory_status(api_response, ["TM123"])
    assert len(results) == 0
