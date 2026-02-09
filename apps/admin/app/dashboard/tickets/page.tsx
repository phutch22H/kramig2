"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function TicketsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ticketDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  const stats = [
    { label: "Total Events", value: data?.total_events ?? 0 },
    { label: "Tickets Sold", value: data?.total_sold?.toLocaleString() ?? "0" },
    { label: "Available", value: data?.total_available?.toLocaleString() ?? "0" },
    { label: "Sell-Through", value: `${data?.overall_sell_through_pct ?? 0}%` },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Per-Event Breakdown</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Event</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Date</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Sold</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Available</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Capacity</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Sell-Through</th>
            </tr>
          </thead>
          <tbody>
            {(data?.events || []).map((e: any) => {
              const pct = e.total_capacity > 0 ? Math.round((e.total_sold / e.total_capacity) * 100) : 0;
              return (
                <tr key={e.event_id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{e.event_name}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>{e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.total_sold?.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.total_available?.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.total_capacity?.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <div style={{ width: "60px", height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "#16a34a" : pct > 50 ? "#f59e0b" : "#6366f1", borderRadius: "3px" }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!data?.events || data.events.length === 0) && (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No ticket data available</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
