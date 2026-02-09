import type { MetadataRoute } from "next";
import { fetchAllEvents } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await fetchAllEvents();

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${BASE_URL}/events/${event.id}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...eventEntries,
  ];
}
