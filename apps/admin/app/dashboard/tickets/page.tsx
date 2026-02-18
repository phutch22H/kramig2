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
          <div key={s.label} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "0.25rem", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Per-Event Breakdown</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Event</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Date</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Sold</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Available</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Capacity</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Sell-Through</th>
            </tr>
          </thead>
          <tbody>
            {(data?.events || []).map((e: any) => {
              const pct = e.total_capacity > 0 ? Math.round((e.total_sold / e.total_capacity) * 100) : 0;
              return (
                <tr key={e.event_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 500 }}>{e.event_name}</td>
                  <td style={{ padding: "10px 16px", color: "#6b7280" }}>{e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.total_sold?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.total_available?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.total_capacity?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <div style={{ width: "60px", height: "4px", background: "#e5e7eb", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "#00d97e" : pct > 50 ? "#f59e0b" : "#2563eb", borderRadius: "2px" }} />
                      </div>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
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
