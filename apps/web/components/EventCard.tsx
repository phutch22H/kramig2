import Link from "next/link";
import type { Event } from "@/lib/api";

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="card">
      <div className="card-image">
        {event.image_url ? (
          <img src={event.image_url} alt={event.name} loading="lazy" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "var(--color-primary)",
              fontWeight: 700,
              opacity: 0.4,
            }}
          >
            {event.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="card-body">
        <p className="card-date">{formatDate(event.date)}</p>
        <h3>{event.name}</h3>
        {event.venue && <p className="card-venue">{event.venue}</p>}
        {event.organizer && (
          <p className="card-organizer">by {event.organizer}</p>
        )}
      </div>
    </Link>
  );
}
