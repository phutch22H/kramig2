"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  initialSearch = "",
  initialCity = "",
}: {
  initialSearch?: string;
  initialCity?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());
    const qs = params.toString();
    router.push(`/events${qs ? `?${qs}` : ""}`);
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search events"
      />
      <input
        type="text"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        aria-label="Filter by city"
      />
      <button type="submit">Search</button>
    </form>
  );
}
