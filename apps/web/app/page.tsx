import { fetchEvents } from "@/lib/api";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";

export default async function HomePage() {
  const data = await fetchEvents({ page: 1, page_size: 8 });

  return (
    <>
      <section className="hero">
        <h1>Find Your Next Experience</h1>
        <p>
          Discover concerts, festivals, theater, sports and more happening near
          you.
        </p>
        <SearchBar />
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Featured Events</h2>

          {data.items.length > 0 ? (
            <div className="grid grid-4">
              {data.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No events found</h2>
              <p>Check back soon for upcoming events.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
