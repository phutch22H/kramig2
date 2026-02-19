"""Last.fm API integration for artist recommendations."""
import os

import httpx

LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/"


async def get_similar_artists(
    artist_name: str, limit: int = 30
) -> list[dict] | None:
    """Fetch similar artists from Last.fm.

    Returns a list of dicts with keys: name, match (0.0-1.0).
    Requires LASTFM_API_KEY environment variable.
    Returns None if credentials missing or API fails.
    """
    api_key = os.environ.get("LASTFM_API_KEY")
    if not api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                LASTFM_BASE,
                params={
                    "method": "artist.getsimilar",
                    "artist": artist_name,
                    "api_key": api_key,
                    "format": "json",
                    "limit": limit,
                    "autocorrect": 1,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            similar = data.get("similarartists", {}).get("artist", [])
            return [
                {
                    "name": a["name"],
                    "match": float(a.get("match", 0)),
                }
                for a in similar
                if isinstance(a, dict) and a.get("name")
            ]
    except Exception:
        return None
