"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [ticketData, setTicketData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.ticketDashboard().catch(() => null),
      api.financialSummary().catch(() => null),
    ]).then(([tickets, financials]) => {
      setTicketData(tickets);
      setFinancialData(financials);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const stats = [
    { label: "Total Events", value: ticketData?.total_events ?? 0 },
    { label: "Tickets Sold", value: ticketData?.total_sold?.toLocaleString() ?? "0" },
    { label: "Sell-Through", value: `${ticketData?.overall_sell_through_pct ?? 0}%` },
    { label: "Revenue", value: `$${(financialData?.total_gross_revenue ?? 0).toLocaleString()}` },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "white", padding: "16px 20px", borderRadius: "6px", border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginTop: "0.25rem", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {ticketData?.events?.length > 0 && (
        <div style={{ background: "white", borderRadius: "6px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e5e5", fontWeight: 600 }}>Events Overview</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Event</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Sold</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Available</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {ticketData.events.map((e: any) => (
                <tr key={e.event_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ fontWeight: 500 }}>{e.event_name}</div>
                    {e.event_date && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{new Date(e.event_date).toLocaleDateString()}</div>}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{e.total_sold?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{e.total_available?.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>{e.total_capacity?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
