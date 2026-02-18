"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [sellerLinks, setSellerLinks] = useState<any[]>([]);
  const [ticketCounts, setTicketCounts] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [newArtist, setNewArtist] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [eventId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [ev, arts, links, counts] = await Promise.all([
        api.getEvent(eventId),
        api.listArtists(eventId).catch(() => []),
        api.listSellerLinks(eventId).catch(() => []),
        api.latestCounts(eventId).catch(() => []),
      ]);
      setEvent(ev);
      setEditForm(ev);
      setArtists(arts);
      setSellerLinks(links);
      setTicketCounts(counts);
    } catch {
      router.push("/dashboard/events");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const updated = await api.updateEvent(eventId, {
        name: editForm.name, description: editForm.description,
        venue_name: editForm.venue_name, status: editForm.status,
        is_public: editForm.is_public, capacity: editForm.capacity,
      });
      setEvent(updated);
      setEditing(false);
    } catch {}
  }

  async function handleAddArtist() {
    if (!newArtist.trim()) return;
    await api.addArtist(eventId, { artist_name: newArtist, is_headliner: artists.length === 0 });
    setNewArtist("");
    const arts = await api.listArtists(eventId);
    setArtists(arts);
  }

  async function handleRemoveArtist(artistId: string) {
    await api.removeArtist(eventId, artistId);
    setArtists(artists.filter((a) => a.id !== artistId));
  }

  async function handlePoll() {
    await api.triggerPoll(eventId);
    setTimeout(() => api.latestCounts(eventId).then(setTicketCounts), 3000);
  }

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    await api.deleteEvent(eventId);
    router.push("/dashboard/events");
  }

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" as const };
  const sectionStyle = { background: "white", padding: "1.25rem", borderRadius: "6px", border: "1px solid #e5e5e5", marginBottom: "1.5rem" };

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Event Info */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{event.name}</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} style={{ padding: "0.375rem 0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                <button onClick={handleDelete} style={{ padding: "0.375rem 0.75rem", background: "#ff3b3b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
              </>
            ) : (
              <>
                <button onClick={handleSave} style={{ padding: "0.375rem 0.75rem", background: "#00d97e", color: "#0a0a0a", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Save</button>
                <button onClick={() => { setEditing(false); setEditForm(event); }} style={{ padding: "0.375rem 0.75rem", background: "#6b7280", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input style={inputStyle} value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
            <textarea style={{ ...inputStyle, minHeight: "60px" }} value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <input style={inputStyle} value={editForm.venue_name || ""} onChange={(e) => setEditForm({ ...editForm, venue_name: e.target.value })} placeholder="Venue" />
              <select style={inputStyle} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="draft">Draft</option><option value="published">Published</option><option value="completed">Completed</option>
              </select>
              <input type="number" style={inputStyle} value={editForm.capacity || ""} onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || null })} placeholder="Capacity" />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={editForm.is_public} onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })} /> Public
            </label>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
            <div>Venue: {event.venue_name || "\u2014"}</div>
            <div>Date: {event.event_date ? new Date(event.event_date).toLocaleString() : "\u2014"}</div>
            <div>Status: <span style={{ fontWeight: 600, color: "#111827" }}>{event.status}</span></div>
            <div>Capacity: {event.capacity?.toLocaleString() || "\u2014"}</div>
            <div>Public: {event.is_public ? "Yes" : "No"}</div>
          </div>
        )}
      </div>

      {/* Artists */}
      <div style={sectionStyle}>
        <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Artists</h3>
        {artists.map((a) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #f0f0f0" }}>
            <span>{a.artist_name} {a.is_headliner && <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#92400e", padding: "0.125rem 0.375rem", borderRadius: "4px", marginLeft: "0.5rem" }}>Headliner</span>}</span>
            <button onClick={() => handleRemoveArtist(a.id)} style={{ color: "#ff3b3b", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>Remove</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <input style={{ ...inputStyle, flex: 1 }} value={newArtist} onChange={(e) => setNewArtist(e.target.value)} placeholder="Artist name" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddArtist())} />
          <button onClick={handleAddArtist} style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", whiteSpace: "nowrap" }}>Add</button>
        </div>
      </div>

      {/* Seller Links */}
      <div style={sectionStyle}>
        <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Ticket Seller Links</h3>
        {sellerLinks.map((l) => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #f0f0f0", fontSize: "0.875rem" }}>
            <div>
              <span style={{ fontWeight: 500 }}>{l.seller_name}</span>
              <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>ID: {l.external_event_id}</span>
            </div>
            <button onClick={async () => { await api.removeSellerLink(eventId, l.id); setSellerLinks(sellerLinks.filter((s) => s.id !== l.id)); }}
              style={{ color: "#ff3b3b", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>Unlink</button>
          </div>
        ))}
        {sellerLinks.length === 0 && <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No sellers linked. Connect a seller in Connectors settings first.</div>}
      </div>

      {/* Ticket Counts */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontWeight: 600 }}>Ticket Counts</h3>
          <button onClick={handlePoll} style={{ padding: "0.375rem 0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Poll Now</button>
        </div>
        {ticketCounts.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Seller</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Sold</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Available</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Capacity</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Sell-Through</th>
              </tr>
            </thead>
            <tbody>
              {ticketCounts.map((t, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 16px" }}>{t.seller_name}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{t.total_sold?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{t.total_available?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{t.total_capacity?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{t.sell_through_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No ticket data yet. Link a seller and trigger a poll.</div>
        )}
      </div>
    </div>
  );
}
