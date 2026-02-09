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
  artists?: string[];
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

    return res.json();
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

    return res.json();
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
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
