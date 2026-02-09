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
          <div key={s.label} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", marginTop: "0.25rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {ticketData?.events?.length > 0 && (
        <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Events Overview</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Event</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Sold</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Available</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {ticketData.events.map((e: any) => (
                <tr key={e.event_id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 500 }}>{e.event_name}</div>
                    {e.event_date && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{new Date(e.event_date).toLocaleDateString()}</div>}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.total_sold?.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.total_available?.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{e.total_capacity?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
