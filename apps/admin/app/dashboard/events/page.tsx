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
                padding: "0.375rem 0.75rem", borderRadius: "4px", fontSize: "0.875rem",
                background: status === s ? "#2563eb" : "white",
                color: status === s ? "white" : "#525252",
                border: status === s ? "1px solid #2563eb" : "1px solid #d4d4d4",
                cursor: "pointer",
              }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => router.push("/dashboard/events/new")}
          style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
          + New Event
        </button>
      </div>

      {loading ? (
        <div>Loading events...</div>
      ) : (
        <div style={{ background: "white", borderRadius: "6px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Venue</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} onClick={() => router.push(`/dashboard/events/${e.id}`)}
                  style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "10px 16px", fontWeight: 500 }}>{e.name}</td>
                  <td style={{ padding: "10px 16px", color: "#6b7280" }}>{e.venue_name || "\u2014"}</td>
                  <td style={{ padding: "10px 16px", color: "#6b7280" }}>{e.event_date ? new Date(e.event_date).toLocaleDateString() : "\u2014"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      display: "inline-block", padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                      background: e.status === "published" ? "#ecfdf5" : e.status === "completed" ? "#eff6ff" : "#f5f5f5",
                      color: e.status === "published" ? "#00d97e" : e.status === "completed" ? "#2563eb" : "#525252",
                    }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{e.capacity?.toLocaleString() || "\u2014"}</td>
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
