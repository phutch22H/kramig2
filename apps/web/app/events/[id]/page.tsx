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
              <li key={artist}>{artist}</li>
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
