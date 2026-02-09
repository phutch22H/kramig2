import type { Metadata } from "next";
import Link from "next/link";
import { fetchEvents } from "@/lib/api";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";

interface PageProps {
  searchParams: { search?: string; city?: string; page?: string };
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const parts: string[] = ["Events"];
  if (searchParams.search) parts.push(`matching "${searchParams.search}"`);
  if (searchParams.city) parts.push(`in ${searchParams.city}`);

  const title = parts.join(" ");
  return {
    title,
    description: `Browse upcoming events${searchParams.city ? ` in ${searchParams.city}` : ""}. Find concerts, festivals, theater and more.`,
  };
}

export default async function EventsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1;
  const data = await fetchEvents({
    search: searchParams.search,
    city: searchParams.city,
    page,
    page_size: 12,
  });

  function buildPageUrl(p: number): string {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.city) params.set("city", searchParams.city);
    params.set("page", String(p));
    return `/events?${params.toString()}`;
  }

  return (
    <>
      <div className="container page-header">
        <h1>Events</h1>
        <div style={{ marginTop: 20 }}>
          <SearchBar
            initialSearch={searchParams.search || ""}
            initialCity={searchParams.city || ""}
          />
        </div>
      </div>

      <section className="section">
        <div className="container">
          {data.items.length > 0 ? (
            <>
              <div className="grid grid-3">
                {data.items.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {data.total_pages > 1 && (
                <div className="pagination">
                  {page > 1 && (
                    <Link href={buildPageUrl(page - 1)}>Prev</Link>
                  )}
                  {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === data.total_pages ||
                        Math.abs(p - page) <= 2
                    )
                    .map((p, idx, arr) => {
                      const elements: React.ReactNode[] = [];
                      if (idx > 0 && arr[idx - 1] !== p - 1) {
                        elements.push(<span key={`gap-${p}`}>...</span>);
                      }
                      elements.push(
                        p === page ? (
                          <span key={p} className="active">
                            {p}
                          </span>
                        ) : (
                          <Link key={p} href={buildPageUrl(p)}>
                            {p}
                          </Link>
                        )
                      );
                      return elements;
                    })}
                  {page < data.total_pages && (
                    <Link href={buildPageUrl(page + 1)}>Next</Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2>No events found</h2>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
