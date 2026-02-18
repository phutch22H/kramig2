"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", venue_name: "", venue_address: "",
    event_date: "", doors_open: "", on_sale_date: "",
    capacity: "", status: "draft", image_url: "", is_public: false,
  });

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

      const event = await api.createEvent(payload);
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>Venue Name</label>
            <input style={inputStyle} value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Venue Address</label>
            <input style={inputStyle} value={form.venue_address} onChange={(e) => update("venue_address", e.target.value)} />
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
