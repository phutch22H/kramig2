"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const statuses = ["all", "draft", "published", "completed"];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    api.listEvents({ status: status === "all" ? undefined : status })
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              style={{
                padding: "0.375rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.875rem",
                background: status === s ? "#6366f1" : "white", color: status === s ? "white" : "#374151", cursor: "pointer",
              }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => router.push("/dashboard/events/new")}
          style={{ padding: "0.5rem 1rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
          + New Event
        </button>
      </div>

      {loading ? (
        <div>Loading events...</div>
      ) : (
        <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Venue</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Date</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} onClick={() => router.push(`/dashboard/events/${e.id}`)}
                  style={{ borderTop: "1px solid #f3f4f6", cursor: "pointer" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{e.name}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>{e.venue_name || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>{e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      display: "inline-block", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                      background: e.status === "published" ? "#d1fae5" : e.status === "completed" ? "#dbeafe" : "#f3f4f6",
                      color: e.status === "published" ? "#065f46" : e.status === "completed" ? "#1e40af" : "#374151",
                    }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.capacity?.toLocaleString() || "—"}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No events found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
