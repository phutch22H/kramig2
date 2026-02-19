"""Spotify API integration for fetching artist top track URLs."""
import base64
import os

import httpx


async def get_top_track_url(artist_name: str) -> str | None:
    """Fetch the Spotify URL for an artist's top track.

    Returns a URL like https://open.spotify.com/track/{id} or None on failure.
    Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.
    """
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get access token via client credentials flow
            credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            token_resp = await client.post(
                "https://accounts.spotify.com/api/token",
                headers={"Authorization": f"Basic {credentials}"},
                data={"grant_type": "client_credentials"},
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}

            # Search for top track by artist name
            search_resp = await client.get(
                "https://api.spotify.com/v1/search",
                params={"q": f"artist:{artist_name}", "type": "track", "limit": 1},
                headers=headers,
            )
            search_resp.raise_for_status()
            tracks = search_resp.json().get("tracks", {}).get("items", [])
            if not tracks:
                return None

            return tracks[0].get("external_urls", {}).get("spotify")

    except Exception:
        return None
