"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SelectedArtist {
  id?: string;
  name: string;
  genre?: string;
  isNew?: boolean;
  is_headliner: boolean;
}

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", venue_id: "" as string | undefined,
    venue_name: "", venue_address: "",
    event_date: "", doors_open: "", on_sale_date: "",
    capacity: "", status: "draft", image_url: "", is_public: false,
  });

  // Venue picker state
  const [venueSearch, setVenueSearch] = useState("");
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [searchingVenues, setSearchingVenues] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const venueSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const venueDropdownRef = useRef<HTMLDivElement>(null);

  // Artist picker state
  const [selectedArtists, setSelectedArtists] = useState<SelectedArtist[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingArtists, setSearchingArtists] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (venueDropdownRef.current && !venueDropdownRef.current.contains(e.target as Node)) {
        setShowVenueDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleVenueSearchChange(value: string) {
    setVenueSearch(value);
    if (venueSearchTimeout.current) clearTimeout(venueSearchTimeout.current);
    if (value.trim().length < 2) {
      setVenueResults([]);
      setShowVenueDropdown(false);
      return;
    }
    venueSearchTimeout.current = setTimeout(async () => {
      setSearchingVenues(true);
      try {
        const data = await api.listVenueDirectory({ search: value.trim(), page_size: 8 });
        setVenueResults(data.items || []);
        setShowVenueDropdown(true);
      } catch {
        setVenueResults([]);
      } finally {
        setSearchingVenues(false);
      }
    }, 300);
  }

  function selectVenue(venue: any) {
    setSelectedVenue(venue);
    setForm((prev) => ({
      ...prev,
      venue_id: venue.id,
      venue_name: venue.name,
      venue_address: venue.address || "",
    }));
    setVenueSearch("");
    setShowVenueDropdown(false);
  }

  function clearVenue() {
    setSelectedVenue(null);
    setForm((prev) => ({
      ...prev,
      venue_id: undefined,
      venue_name: "",
      venue_address: "",
    }));
  }

  function handleArtistSearchChange(value: string) {
    setArtistSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setArtistResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchingArtists(true);
      try {
        const data = await api.listArtistDirectory({ search: value.trim(), page_size: 8 });
        setArtistResults(data.items || []);
        setShowDropdown(true);
      } catch {
        setArtistResults([]);
      } finally {
        setSearchingArtists(false);
      }
    }, 300);
  }

  function selectArtist(artist: any) {
    if (selectedArtists.some((a) => a.id === artist.id)) return;
    setSelectedArtists([...selectedArtists, {
      id: artist.id, name: artist.name, genre: artist.genre,
      is_headliner: selectedArtists.length === 0,
    }]);
    setArtistSearch("");
    setShowDropdown(false);
  }

  function addNewArtist() {
    const name = artistSearch.trim();
    if (!name || selectedArtists.some((a) => a.name.toLowerCase() === name.toLowerCase())) return;
    setSelectedArtists([...selectedArtists, {
      name, isNew: true, is_headliner: selectedArtists.length === 0,
    }]);
    setArtistSearch("");
    setShowDropdown(false);
  }

  function removeSelectedArtist(index: number) {
    setSelectedArtists(selectedArtists.filter((_, i) => i !== index));
  }

  function update(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = { ...form };
      if (payload.capacity) payload.capacity = parseInt(payload.capacity);
      else delete payload.capacity;
      if (!payload.event_date) delete payload.event_date;
      if (!payload.doors_open) delete payload.doors_open;
      if (!payload.on_sale_date) delete payload.on_sale_date;
      if (!payload.image_url) delete payload.image_url;
      if (!payload.venue_id) delete payload.venue_id;

      const event = await api.createEvent(payload);

      // Add artists to the event
      for (let i = 0; i < selectedArtists.length; i++) {
        const a = selectedArtists[i];
        await api.addArtist(event.id, {
          artist_name: a.name,
          artist_id: a.id || undefined,
          is_headliner: a.is_headliner,
          sort_order: i,
        });
      }

      router.push(`/dashboard/events/${event.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" as const };
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em", color: "#a3a3a3", marginBottom: "0.25rem" };

  return (
    <div style={{ maxWidth: "640px" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Create Event</h2>
      {error && <div style={{ background: "#fef2f2", color: "#ff3b3b", padding: "0.75rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ background: "white", padding: "1.5rem", borderRadius: "6px", border: "1px solid #e5e5e5" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Event Name *</label>
          <input style={inputStyle} value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: "80px" }} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        {/* Venue Picker */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Venue</label>
          {selectedVenue ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", background: "#f0f9ff", border: "1px solid #bae6fd",
              borderRadius: "4px", fontSize: "13px",
            }}>
              <div>
                <span style={{ fontWeight: 500 }}>{selectedVenue.name}</span>
                {selectedVenue.city && <span style={{ color: "#2563eb", fontSize: "11px", marginLeft: "8px" }}>{selectedVenue.city}</span>}
                {selectedVenue.address && <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{selectedVenue.address}</div>}
              </div>
              <button type="button" onClick={clearVenue}
                style={{ background: "none", border: "none", color: "#a3a3a3", cursor: "pointer", fontSize: "16px", padding: "0 4px" }}>&times;</button>
            </div>
          ) : (
            <div ref={venueDropdownRef} style={{ position: "relative" }}>
              <input
                style={inputStyle}
                value={venueSearch}
                onChange={(e) => handleVenueSearchChange(e.target.value)}
                onFocus={() => venueResults.length > 0 && setShowVenueDropdown(true)}
                placeholder="Search for a venue..."
              />
              {showVenueDropdown && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                  background: "white", border: "1px solid #d4d4d4", borderRadius: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "240px", overflowY: "auto",
                  marginTop: "2px",
                }}>
                  {searchingVenues && <div style={{ padding: "8px 12px", fontSize: "12px", color: "#a3a3a3" }}>Searching...</div>}
                  {venueResults.map((v) => (
                    <div key={v.id} onClick={() => selectVenue(v)}
                      style={{
                        padding: "8px 12px", cursor: "pointer", fontSize: "13px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        borderBottom: "1px solid #f5f5f5",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <span>{v.name}</span>
                      {v.city && <span style={{ fontSize: "11px", color: "#2563eb", background: "#dbeafe", padding: "1px 6px", borderRadius: "3px" }}>{v.city}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Artists Picker */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Artists</label>
          {selectedArtists.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {selectedArtists.map((a, i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "4px 10px", background: a.is_headliner ? "#dbeafe" : "#f5f5f5",
                  border: `1px solid ${a.is_headliner ? "#93c5fd" : "#e5e5e5"}`,
                  borderRadius: "4px", fontSize: "12px",
                }}>
                  <span style={{ fontWeight: 500 }}>{a.name}</span>
                  {a.genre && <span style={{ color: "#2563eb", fontSize: "10px" }}>{a.genre}</span>}
                  {a.is_headliner && <span style={{ fontSize: "9px", background: "#fef3c7", color: "#92400e", padding: "1px 4px", borderRadius: "2px" }}>Headliner</span>}
                  {a.isNew && <span style={{ fontSize: "9px", background: "#ecfdf5", color: "#059669", padding: "1px 4px", borderRadius: "2px" }}>New</span>}
                  <button type="button" onClick={() => removeSelectedArtist(i)}
                    style={{ background: "none", border: "none", color: "#a3a3a3", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: 0 }}>&times;</button>
                </div>
              ))}
            </div>
          )}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <input
              style={inputStyle}
              value={artistSearch}
              onChange={(e) => handleArtistSearchChange(e.target.value)}
              onFocus={() => artistResults.length > 0 && setShowDropdown(true)}
              placeholder="Search for an artist..."
            />
            {showDropdown && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                background: "white", border: "1px solid #d4d4d4", borderRadius: "4px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "240px", overflowY: "auto",
                marginTop: "2px",
              }}>
                {searchingArtists && <div style={{ padding: "8px 12px", fontSize: "12px", color: "#a3a3a3" }}>Searching...</div>}
                {artistResults.map((a) => (
                  <div key={a.id} onClick={() => selectArtist(a)}
                    style={{
                      padding: "8px 12px", cursor: "pointer", fontSize: "13px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderBottom: "1px solid #f5f5f5",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f7")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <span>{a.name}</span>
                    {a.genre && <span style={{ fontSize: "11px", color: "#2563eb", background: "#dbeafe", padding: "1px 6px", borderRadius: "3px" }}>{a.genre}</span>}
                  </div>
                ))}
                {!searchingArtists && artistSearch.trim().length >= 2 && (
                  <div onClick={addNewArtist}
                    style={{
                      padding: "8px 12px", cursor: "pointer", fontSize: "13px",
                      color: "#059669", fontWeight: 500, borderTop: artistResults.length > 0 ? "1px solid #e5e5e5" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ecfdf5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    + Add &quot;{artistSearch.trim()}&quot; as new artist
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Event Date</label>
            <input type="datetime-local" style={inputStyle} value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Doors Open</label>
            <input type="datetime-local" style={inputStyle} value={form.doors_open} onChange={(e) => update("doors_open", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>On Sale Date</label>
            <input type="datetime-local" style={inputStyle} value={form.on_sale_date} onChange={(e) => update("on_sale_date", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Capacity</label>
            <input type="number" style={inputStyle} value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={labelStyle}>Image URL</label>
          <input style={inputStyle} value={form.image_url} onChange={(e) => update("image_url", e.target.value)} />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_public} onChange={(e) => update("is_public", e.target.checked)} />
            Public event (visible on consumer app)
          </label>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="submit" disabled={loading}
            style={{ padding: "0.5rem 1.5rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
            {loading ? "Creating..." : "Create Event"}
          </button>
          <button type="button" onClick={() => router.back()}
            style={{ padding: "0.5rem 1.5rem", background: "white", color: "#374151", border: "1px solid #d4d4d4", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
