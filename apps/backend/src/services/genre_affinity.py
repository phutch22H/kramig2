"""
Genre affinity map for artist recommendation.
Scores range from 0.0 (unrelated) to 1.0 (same genre).
Same-genre matching is handled by get_affinity(), not stored in the map.
The map is symmetric: if A->B is 0.7, then B->A is also 0.7.
"""

GENRE_AFFINITY: dict[str, dict[str, float]] = {
    "Electronic": {
        "Techno": 0.85, "House": 0.80, "EDM": 0.75, "Trance": 0.70,
        "Drum & Bass": 0.60, "Garage": 0.55, "Dance": 0.70,
        "Synth-Pop": 0.50, "Trip-Hop": 0.45, "Darkwave": 0.40,
        "Experimental": 0.40, "Hyperpop": 0.35,
    },
    "Techno": {
        "House": 0.80, "EDM": 0.60, "Trance": 0.65, "Drum & Bass": 0.50,
        "Garage": 0.45, "Dance": 0.55, "Darkwave": 0.45,
        "Experimental": 0.40,
    },
    "House": {
        "EDM": 0.65, "Trance": 0.55, "Drum & Bass": 0.45,
        "Garage": 0.70, "Dance": 0.75, "Funk": 0.40, "Soul": 0.35,
    },
    "EDM": {
        "Trance": 0.70, "Dance": 0.80, "Drum & Bass": 0.50,
        "Pop": 0.40, "Hyperpop": 0.40,
    },
    "Trance": {
        "Dance": 0.60, "Drum & Bass": 0.45,
    },
    "Drum & Bass": {
        "Garage": 0.55, "Dance": 0.50, "Grime": 0.45,
    },
    "Garage": {
        "Dance": 0.50, "Grime": 0.55, "R&B": 0.35,
    },
    "Dance": {
        "Pop": 0.50, "Synth-Pop": 0.50,
    },
    "Hip-Hop": {
        "Grime": 0.80, "R&B": 0.75, "Afrobeats": 0.50,
        "Reggaeton": 0.45, "Soul": 0.40, "Funk": 0.40,
        "Pop": 0.30, "Electronic": 0.25,
    },
    "Grime": {
        "R&B": 0.50, "Drum & Bass": 0.45, "Garage": 0.55,
    },
    "R&B": {
        "Soul": 0.80, "Funk": 0.60, "Pop": 0.55, "Afrobeats": 0.50,
        "Jazz": 0.45, "Art Pop": 0.35, "Trip-Hop": 0.35,
    },
    "Rock": {
        "Metal": 0.60, "Punk": 0.65, "Grunge": 0.75,
        "Post-Punk": 0.60, "Alternative": 0.70, "Britpop": 0.65,
        "Noise Rock": 0.55, "Indie": 0.55, "Ska": 0.40,
    },
    "Metal": {
        "Punk": 0.50, "Grunge": 0.55, "Noise Rock": 0.50,
        "Post-Punk": 0.35,
    },
    "Punk": {
        "Grunge": 0.65, "Post-Punk": 0.70, "Ska": 0.55,
        "Noise Rock": 0.50, "Alternative": 0.50,
    },
    "Grunge": {
        "Alternative": 0.65, "Noise Rock": 0.50,
    },
    "Post-Punk": {
        "Darkwave": 0.70, "Synth-Pop": 0.50, "New Wave": 0.65,
        "Indie": 0.55, "Alternative": 0.55, "Shoegaze": 0.50,
        "Noise Rock": 0.45, "Post-Rock": 0.55,
    },
    "Indie": {
        "Alternative": 0.80, "Dream Pop": 0.70, "Shoegaze": 0.60,
        "Post-Rock": 0.55, "Britpop": 0.65, "Folk": 0.50,
        "Art Pop": 0.50, "Psychedelic": 0.50,
    },
    "Alternative": {
        "Britpop": 0.60, "Dream Pop": 0.55, "Shoegaze": 0.50,
        "Art Pop": 0.45, "Psychedelic": 0.50,
    },
    "Dream Pop": {
        "Shoegaze": 0.80, "Post-Rock": 0.50, "Art Pop": 0.45,
        "Synth-Pop": 0.40, "Psychedelic": 0.50,
    },
    "Shoegaze": {
        "Post-Rock": 0.55, "Noise Rock": 0.40, "Psychedelic": 0.50,
    },
    "Pop": {
        "Art Pop": 0.60, "Synth-Pop": 0.65, "Hyperpop": 0.55,
        "French Pop": 0.60, "New Wave": 0.45, "Dance": 0.50,
        "R&B": 0.55, "Indie": 0.40, "Reggaeton": 0.35,
    },
    "Art Pop": {
        "Synth-Pop": 0.50, "Experimental": 0.50, "French Pop": 0.50,
    },
    "Synth-Pop": {
        "New Wave": 0.75, "Darkwave": 0.65, "Hyperpop": 0.45,
    },
    "Hyperpop": {
        "Experimental": 0.45,
    },
    "New Wave": {
        "Darkwave": 0.55,
    },
    "Jazz": {
        "Soul": 0.70, "Funk": 0.65, "R&B": 0.45,
        "Classical": 0.30, "Trip-Hop": 0.40,
    },
    "Soul": {
        "Funk": 0.75, "Afrobeats": 0.40, "Reggae": 0.35,
    },
    "Funk": {
        "Afrobeats": 0.40,
    },
    "Folk": {
        "Country": 0.65, "World": 0.40, "Reggae": 0.30,
    },
    "Country": {
        "Rock": 0.35,
    },
    "Reggae": {
        "Dub": 0.85, "Reggaeton": 0.55, "Afrobeats": 0.50,
        "World": 0.50, "Ska": 0.50,
    },
    "Dub": {
        "Trip-Hop": 0.50, "Electronic": 0.35, "Reggaeton": 0.40,
    },
    "Afrobeats": {
        "Reggaeton": 0.55, "World": 0.60, "Latin": 0.50,
        "Dance": 0.40,
    },
    "Reggaeton": {
        "Latin": 0.80, "Dance": 0.45,
    },
    "Latin": {
        "World": 0.50, "Pop": 0.35,
    },
    "Trip-Hop": {
        "Darkwave": 0.45,
    },
    "Psychedelic": {
        "Experimental": 0.55, "Post-Rock": 0.45,
    },
    "Experimental": {
        "Noise Rock": 0.50, "Post-Rock": 0.45, "Art Pop": 0.50,
    },
    "Post-Rock": {
        "Classical": 0.30,
    },
}


def get_affinity(genre_a: str, genre_b: str) -> float:
    """Return the affinity score between two genres. Symmetric lookup."""
    if genre_a == genre_b:
        return 1.0
    score = GENRE_AFFINITY.get(genre_a, {}).get(genre_b)
    if score is not None:
        return score
    score = GENRE_AFFINITY.get(genre_b, {}).get(genre_a)
    if score is not None:
        return score
    return 0.0


def get_related_genres(genre: str, min_affinity: float = 0.3) -> dict[str, float]:
    """Return all genres related to the given genre with at least min_affinity score.

    Returns dict of {genre_name: affinity_score}, sorted by score descending.
    Always includes the genre itself with score 1.0.
    """
    related: dict[str, float] = {genre: 1.0}

    # Direct entries where this genre is the key
    if genre in GENRE_AFFINITY:
        for other, score in GENRE_AFFINITY[genre].items():
            if score >= min_affinity:
                related[other] = score

    # Reverse entries where this genre appears as a value
    for other_genre, affinities in GENRE_AFFINITY.items():
        if genre in affinities and affinities[genre] >= min_affinity:
            if other_genre not in related or affinities[genre] > related[other_genre]:
                related[other_genre] = affinities[genre]

    return dict(sorted(related.items(), key=lambda x: x[1], reverse=True))
