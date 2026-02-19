const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Event {
  id: string;
  name: string;
  description?: string;
  date: string;
  venue?: string;
  city?: string;
  image_url?: string;
  organizer?: string;
  artists?: { name: string; is_headliner?: boolean; genre?: string; spotify_track_url?: string }[];
  buy_links?: { label: string; url: string }[];
}

export interface EventsResponse {
  items: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function fetchEvents(
  params: {
    search?: string;
    city?: string;
    page?: number;
    page_size?: number;
  } = {}
): Promise<EventsResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.city) searchParams.set("city", params.city);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));

  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/public/events${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      console.error(`Failed to fetch events: ${res.status} ${res.statusText}`);
      return { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
    }

    const json = await res.json();
    return {
      items: (json.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        date: item.event_date,
        venue: item.venue_name,
        city: item.venue_address,
        image_url: item.image_url,
        organizer: item.organizer,
      })),
      total: json.total || 0,
      page: json.page || 1,
      page_size: json.page_size || 20,
      total_pages: json.total_pages || 0,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };
  }
}

export async function fetchEventDetail(id: string): Promise<Event | null> {
  const url = `${API_URL}/api/v1/public/events/${id}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      console.error(
        `Failed to fetch event ${id}: ${res.status} ${res.statusText}`
      );
      return null;
    }

    const data = await res.json();
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      date: data.event_date,
      venue: data.venue_name,
      city: data.venue_address,
      image_url: data.image_url,
      organizer: data.organizer,
      artists: (data.artists || []).map((a: any) => ({
        name: a.name,
        is_headliner: a.is_headliner,
        genre: a.genre,
        spotify_track_url: a.spotify_track_url,
      })),
      buy_links: (data.buy_links || []).map((l: any) => ({ label: l.seller, url: l.url })),
    };
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  genre?: string;
  spotify_track_url?: string;
}

export interface ArtistsResponse {
  items: Artist[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function fetchArtists(
  params: {
    search?: string;
    letter?: string;
    genre?: string;
    page?: number;
    page_size?: number;
  } = {}
): Promise<ArtistsResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.letter) searchParams.set("letter", params.letter);
  if (params.genre) searchParams.set("genre", params.genre);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.page_size) searchParams.set("page_size", String(params.page_size));

  const qs = searchParams.toString();
  const url = `${API_URL}/api/v1/public/artists${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return { items: [], total: 0, page: 1, page_size: 50, total_pages: 0 };
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching artists:", error);
    return { items: [], total: 0, page: 1, page_size: 50, total_pages: 0 };
  }
}

export async function fetchArtistDetail(slug: string): Promise<Artist | null> {
  const url = `${API_URL}/api/v1/public/artists/${slug}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching artist ${slug}:`, error);
    return null;
  }
}

export interface SimilarArtist extends Artist {
  affinity_score: number;
}

export interface SimilarArtistsResponse {
  artist: Artist;
  similar: SimilarArtist[];
}

export async function fetchSimilarArtists(slug: string): Promise<SimilarArtistsResponse | null> {
  const url = `${API_URL}/api/v1/public/artists/${slug}/similar`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching similar artists for ${slug}:`, error);
    return null;
  }
}

export async function fetchAllEvents(): Promise<Event[]> {
  const allEvents: Event[] = [];
  let page = 1;
  const pageSize = 100;

  try {
    while (true) {
      const data = await fetchEvents({ page, page_size: pageSize });
      allEvents.push(...data.items);

      if (page >= data.total_pages || data.items.length === 0) break;
      page++;
    }
  } catch (error) {
    console.error("Error fetching all events:", error);
  }

  return allEvents;
}
