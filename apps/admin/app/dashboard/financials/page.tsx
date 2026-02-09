"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FinancialsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ event_id: "", seller_id: "", report_date: "", tickets_sold: 0, gross_revenue: 0, net_revenue: 0, fees: 0, refunds: 0, settlement_status: "pending", currency: "USD", notes: "" });

  useEffect(() => {
    api.financialSummary().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await api.createFinancialReport(form);
    setShowCreate(false);
    const updated = await api.financialSummary();
    setData(updated);
  }

  async function handleExport() {
    const blob = await api.exportFinancialsCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financials.csv";
    a.click();
  }

  if (loading) return <div>Loading...</div>;

  const stats = [
    { label: "Gross Revenue", value: `$${(data?.total_gross_revenue ?? 0).toLocaleString()}` },
    { label: "Net Revenue", value: `$${(data?.total_net_revenue ?? 0).toLocaleString()}` },
    { label: "Fees", value: `$${(data?.total_fees ?? 0).toLocaleString()}` },
    { label: "Refunds", value: `$${(data?.total_refunds ?? 0).toLocaleString()}` },
  ];

  const inputStyle = { width: "100%", padding: "0.375rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.8rem", boxSizing: "border-box" as const };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: "0.5rem 1rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
          {showCreate ? "Cancel" : "+ Add Report"}
        </button>
        <button onClick={handleExport} style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "0.875rem" }}>Export CSV</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Event ID</label><input required style={inputStyle} value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Seller ID</label><input required style={inputStyle} value={form.seller_id} onChange={(e) => setForm({ ...form, seller_id: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Report Date</label><input required type="datetime-local" style={inputStyle} value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Tickets Sold</label><input type="number" style={inputStyle} value={form.tickets_sold} onChange={(e) => setForm({ ...form, tickets_sold: parseInt(e.target.value) || 0 })} /></div>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Gross Revenue</label><input type="number" step="0.01" style={inputStyle} value={form.gross_revenue} onChange={(e) => setForm({ ...form, gross_revenue: parseFloat(e.target.value) || 0 })} /></div>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Net Revenue</label><input type="number" step="0.01" style={inputStyle} value={form.net_revenue} onChange={(e) => setForm({ ...form, net_revenue: parseFloat(e.target.value) || 0 })} /></div>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Fees</label><input type="number" step="0.01" style={inputStyle} value={form.fees} onChange={(e) => setForm({ ...form, fees: parseFloat(e.target.value) || 0 })} /></div>
            <div><label style={{ fontSize: "0.7rem", color: "#6b7280" }}>Refunds</label><input type="number" step="0.01" style={inputStyle} value={form.refunds} onChange={(e) => setForm({ ...form, refunds: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <button type="submit" style={{ padding: "0.5rem 1.5rem", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>Save Report</button>
        </form>
      )}

      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left" }}>Date</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Tickets</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Gross</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Net</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Fees</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.reports || []).map((r: any) => (
              <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6", fontSize: "0.875rem" }}>
                <td style={{ padding: "0.5rem" }}>{new Date(r.report_date).toLocaleDateString()}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>{r.tickets_sold}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>${r.gross_revenue?.toLocaleString()}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>${r.net_revenue?.toLocaleString()}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>${r.fees?.toLocaleString()}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600, background: r.settlement_status === "settled" ? "#d1fae5" : "#fef3c7", color: r.settlement_status === "settled" ? "#065f46" : "#92400e" }}>
                    {r.settlement_status}
                  </span>
                </td>
              </tr>
            ))}
            {(!data?.reports || data.reports.length === 0) && (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No financial reports</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
