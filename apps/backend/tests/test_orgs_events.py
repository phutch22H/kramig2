import pytest
from httpx import AsyncClient


async def _register_and_create_org(client: AsyncClient) -> tuple[dict, str, str]:
    """Register user, create org, return (org_data, access_token, org_id)."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "orgtest@example.com", "password": "pass123", "full_name": "Org User"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await client.post(
        "/api/v1/orgs",
        json={"name": "Test Promoter", "type": "promoter"},
        headers=headers,
    )
    org = org_resp.json()
    return org, token, org["id"]


@pytest.mark.asyncio
async def test_create_org(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    assert org["name"] == "Test Promoter"
    assert org["type"] == "promoter"


@pytest.mark.asyncio
async def test_list_orgs(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/orgs", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_update_org(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}", "X-Org-Id": org_id}
    response = await client.patch(
        f"/api/v1/orgs/{org_id}",
        json={"name": "Updated Name"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_list_members(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}", "X-Org-Id": org_id}
    response = await client.get(f"/api/v1/orgs/{org_id}/members", headers=headers)
    assert response.status_code == 200
    members = response.json()
    assert len(members) == 1
    assert members[0]["role"] == "owner"


@pytest.mark.asyncio
async def test_create_event(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}", "X-Org-Id": org_id}
    response = await client.post(
        "/api/v1/events",
        json={"name": "Test Concert", "venue_name": "Big Arena", "capacity": 5000},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Concert"


@pytest.mark.asyncio
async def test_list_events(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}", "X-Org-Id": org_id}
    await client.post(
        "/api/v1/events",
        json={"name": "Event 1"},
        headers=headers,
    )
    response = await client.get("/api/v1/events", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_update_event(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}", "X-Org-Id": org_id}
    create = await client.post(
        "/api/v1/events",
        json={"name": "Old Name"},
        headers=headers,
    )
    event_id = create.json()["id"]
    response = await client.patch(
        f"/api/v1/events/{event_id}",
        json={"name": "New Name", "status": "published", "is_public": True},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_event_artists(client: AsyncClient):
    org, token, org_id = await _register_and_create_org(client)
    headers = {"Authorization": f"Bearer {token}", "X-Org-Id": org_id}
    create = await client.post(
        "/api/v1/events",
        json={"name": "Artist Event"},
        headers=headers,
    )
    event_id = create.json()["id"]

    add_resp = await client.post(
        f"/api/v1/events/{event_id}/artists",
        json={"artist_name": "The Band", "is_headliner": True},
        headers=headers,
    )
    assert add_resp.status_code == 201

    list_resp = await client.get(f"/api/v1/events/{event_id}/artists", headers=headers)
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["artist_name"] == "The Band"


@pytest.mark.asyncio
async def test_event_isolation(client: AsyncClient):
    """Events from one org should not be visible to another."""
    # Create first org
    reg1 = await client.post(
        "/api/v1/auth/register",
        json={"email": "org1@example.com", "password": "pass", "full_name": "User 1"},
    )
    token1 = reg1.json()["access_token"]
    org1 = await client.post(
        "/api/v1/orgs", json={"name": "Org 1", "type": "promoter"},
        headers={"Authorization": f"Bearer {token1}"},
    )
    org1_id = org1.json()["id"]
    headers1 = {"Authorization": f"Bearer {token1}", "X-Org-Id": org1_id}

    await client.post("/api/v1/events", json={"name": "Org1 Event"}, headers=headers1)

    # Create second org
    reg2 = await client.post(
        "/api/v1/auth/register",
        json={"email": "org2@example.com", "password": "pass", "full_name": "User 2"},
    )
    token2 = reg2.json()["access_token"]
    org2 = await client.post(
        "/api/v1/orgs", json={"name": "Org 2", "type": "venue"},
        headers={"Authorization": f"Bearer {token2}"},
    )
    org2_id = org2.json()["id"]
    headers2 = {"Authorization": f"Bearer {token2}", "X-Org-Id": org2_id}

    events = await client.get("/api/v1/events", headers=headers2)
    assert len(events.json()) == 0
