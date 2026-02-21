"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FinancialsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [form, setForm] = useState({ event_id: "", seller_id: "", report_date: "", tickets_sold: 0, gross_revenue: 0, net_revenue: 0, fees: 0, refunds: 0, settlement_status: "pending", currency: "GBP", notes: "" });

  useEffect(() => {
    Promise.all([
      api.financialSummary(),
      api.listEvents({ limit: 200 }),
      api.listSellers().catch(() => []),
    ]).then(([summary, evts, slrs]) => {
      setData(summary);
      setEvents(evts || []);
      setSellers(slrs || []);
    }).catch(() => setData(null)).finally(() => setLoading(false));
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
    { label: "Gross Revenue", value: `${currencySymbol(data?.reports?.[0]?.currency)}${(data?.total_gross_revenue ?? 0).toLocaleString()}`, color: "#00d97e" },
    { label: "Net Revenue", value: `${currencySymbol(data?.reports?.[0]?.currency)}${(data?.total_net_revenue ?? 0).toLocaleString()}`, color: "#00d97e" },
    { label: "Fees", value: `${currencySymbol(data?.reports?.[0]?.currency)}${(data?.total_fees ?? 0).toLocaleString()}`, color: "#525252" },
    { label: "Refunds", value: `${currencySymbol(data?.reports?.[0]?.currency)}${(data?.total_refunds ?? 0).toLocaleString()}`, color: "#ff3b3b" },
  ];

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" as const };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3", marginBottom: "4px" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "0.25rem", fontVariantNumeric: "tabular-nums", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600 }}>
          {showCreate ? "Cancel" : "+ Add Report"}
        </button>
        <button onClick={handleExport} style={{ padding: "0.5rem 1rem", border: "1px solid #d4d4d4", borderRadius: "4px", background: "white", cursor: "pointer", fontSize: "0.875rem" }}>Export CSV</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #e5e5e5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={labelStyle}>Event *</label>
              <select required style={inputStyle} value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })}>
                <option value="">Select event...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Seller *</label>
              <select required style={inputStyle} value={form.seller_id} onChange={(e) => setForm({ ...form, seller_id: e.target.value })}>
                <option value="">Select seller...</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Report Date *</label>
              <input required type="datetime-local" style={inputStyle} value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Currency</label>
              <select style={inputStyle} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div><label style={labelStyle}>Tickets Sold</label><input type="number" style={inputStyle} value={form.tickets_sold} onChange={(e) => setForm({ ...form, tickets_sold: parseInt(e.target.value) || 0 })} /></div>
            <div><label style={labelStyle}>Gross Revenue</label><input type="number" step="0.01" style={inputStyle} value={form.gross_revenue} onChange={(e) => setForm({ ...form, gross_revenue: parseFloat(e.target.value) || 0 })} /></div>
            <div><label style={labelStyle}>Net Revenue</label><input type="number" step="0.01" style={inputStyle} value={form.net_revenue} onChange={(e) => setForm({ ...form, net_revenue: parseFloat(e.target.value) || 0 })} /></div>
            <div><label style={labelStyle}>Fees</label><input type="number" step="0.01" style={inputStyle} value={form.fees} onChange={(e) => setForm({ ...form, fees: parseFloat(e.target.value) || 0 })} /></div>
            <div><label style={labelStyle}>Refunds</label><input type="number" step="0.01" style={inputStyle} value={form.refunds} onChange={(e) => setForm({ ...form, refunds: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <button type="submit" style={{ padding: "0.5rem 1.5rem", background: "#00d97e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>Save Report</button>
        </form>
      )}

      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Event</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Seller</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Date</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Tickets</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Gross</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Net</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Fees</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.reports || []).map((r: any) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0", fontSize: "0.875rem" }}>
                <td style={{ padding: "10px 16px", fontWeight: 500 }}>{r.event_name || "\u2014"}</td>
                <td style={{ padding: "10px 16px" }}>
                  {r.seller_name ? (
                    <span style={{ display: "inline-block", padding: "2px 8px", background: "#dbeafe", color: "#2563eb", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>{r.seller_name}</span>
                  ) : "\u2014"}
                </td>
                <td style={{ padding: "10px 16px" }}>{new Date(r.report_date).toLocaleDateString()}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.tickets_sold}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{currencySymbol(r.currency)}{r.gross_revenue?.toLocaleString()}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{currencySymbol(r.currency)}{r.net_revenue?.toLocaleString()}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{currencySymbol(r.currency)}{r.fees?.toLocaleString()}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, background: r.settlement_status === "settled" ? "#ecfdf5" : "#fffbeb", color: r.settlement_status === "settled" ? "#00d97e" : "#f59e0b" }}>
                    {r.settlement_status}
                  </span>
                </td>
              </tr>
            ))}
            {(!data?.reports || data.reports.length === 0) && (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No financial reports</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function currencySymbol(currency?: string): string {
  switch (currency) {
    case "GBP": return "\u00A3";
    case "EUR": return "\u20AC";
    case "USD": return "$";
    default: return "\u00A3";
  }
}
