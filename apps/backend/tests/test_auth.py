import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "securepass123", "full_name": "New User"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dupe@example.com", "password": "pass123", "full_name": "Dupe User"}
    await client.post("/api/v1/auth/register", json=payload)
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "pass123", "full_name": "Login User"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "pass123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "badpass@example.com", "password": "correct", "full_name": "User"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "badpass@example.com", "password": "wrong"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "password": "pass123", "full_name": "Me User"},
    )
    token = reg.json()["access_token"]
    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "pass123", "full_name": "Refresh User"},
    )
    refresh_token = reg.json()["refresh_token"]
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "pass123", "full_name": "Logout User"},
    )
    refresh_token = reg.json()["refresh_token"]
    response = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200

    # Refresh should fail after logout
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 401
