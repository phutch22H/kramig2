import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchEventDetail } from "@/lib/api";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const event = await fetchEventDetail(params.id);

  if (!event) {
    return { title: "Event Not Found" };
  }

  return {
    title: event.name,
    description:
      event.description?.slice(0, 160) ||
      `${event.name} at ${event.venue || "a venue near you"}.`,
    openGraph: {
      title: event.name,
      description:
        event.description?.slice(0, 160) ||
        `${event.name} at ${event.venue || "a venue near you"}.`,
      images: event.image_url ? [{ url: event.image_url }] : undefined,
      type: "website",
    },
  };
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const event = await fetchEventDetail(params.id);

  if (!event) {
    notFound();
  }

  return (
    <article className="event-detail">
      {event.image_url && (
        <div className="event-hero-image">
          <img src={event.image_url} alt={event.name} />
        </div>
      )}

      <h1>{event.name}</h1>

      <div className="event-meta">
        <span>{formatDate(event.date)}</span>
        {event.venue && <span>{event.venue}</span>}
        {event.city && <span>{event.city}</span>}
        {event.organizer && <span>Presented by {event.organizer}</span>}
      </div>

      {event.description && (
        <div className="event-description">
          <p>{event.description}</p>
        </div>
      )}

      {event.artists && event.artists.length > 0 && (
        <div className="event-artists">
          <h2>Artists</h2>
          <ul className="artist-list">
            {event.artists.map((artist) => (
              <li key={artist.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>{artist.name}</span>
                {artist.genre && (
                  <span style={{
                    fontSize: "0.7rem", padding: "2px 8px",
                    background: "rgba(75, 250, 148, 0.12)", color: "#4BFA94",
                    borderRadius: "9999px", fontWeight: 600,
                  }}>
                    {artist.genre}
                  </span>
                )}
                {artist.spotify_track_url && (
                  <a
                    href={artist.spotify_track_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "0.75rem", padding: "3px 10px",
                      background: "#1DB954", color: "#fff",
                      borderRadius: "9999px", fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    Play
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {event.buy_links && event.buy_links.length > 0 && (
        <div className="buy-links">
          {event.buy_links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              {link.label || "Buy Tickets"}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
