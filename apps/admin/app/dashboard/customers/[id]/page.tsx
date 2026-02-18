"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCustomer(customerId),
      api.customerEvents(customerId).catch(() => []),
    ]).then(([c, evts]) => {
      setCustomer(c);
      setForm(c);
      setEvents(evts);
      setLoading(false);
    }).catch(() => router.push("/dashboard/customers"));
  }, [customerId]);

  async function handleSave() {
    const updated = await api.updateCustomer(customerId, {
      first_name: form.first_name, last_name: form.last_name,
      phone: form.phone, city: form.city, country: form.country, notes: form.notes,
    });
    setCustomer(updated);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this customer?")) return;
    await api.deleteCustomer(customerId);
    router.push("/dashboard/customers");
  }

  if (loading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" as const };
  const sectionStyle = { background: "white", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e5e5e5", marginBottom: "1.5rem" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{customer.email}</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} style={{ padding: "0.375rem 0.75rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                <button onClick={handleDelete} style={{ padding: "0.375rem 0.75rem", background: "#ff3b3b", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
              </>
            ) : (
              <>
                <button onClick={handleSave} style={{ padding: "0.375rem 0.75rem", background: "#00d97e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Save</button>
                <button onClick={() => { setEditing(false); setForm(customer); }} style={{ padding: "0.375rem 0.75rem", background: "#6b7280", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3" }}>First Name</label><input style={inputStyle} value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3" }}>Last Name</label><input style={inputStyle} value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3" }}>Phone</label><input style={inputStyle} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3" }}>City</label><input style={inputStyle} value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3" }}>Notes</label><textarea style={{ ...inputStyle, minHeight: "60px" }} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
            <div>Name: {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—"}</div>
            <div>Phone: {customer.phone || "—"}</div>
            <div>City: {customer.city || "—"}</div>
            <div>Country: {customer.country || "—"}</div>
            <div>Events: {customer.total_events_attended}</div>
            <div>Total Spend: ${customer.total_spend?.toFixed(2)}</div>
            <div>Source: {customer.source || "—"}</div>
            <div>Tags: {(customer.tags || []).map((t: string) => (
              <span key={t} style={{ display: "inline-block", padding: "0.125rem 0.375rem", background: "#dbeafe", color: "#2563eb", borderRadius: "4px", fontSize: "0.7rem", marginRight: "0.25rem" }}>{t}</span>
            ))}</div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Event History</h3>
        {events.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Event</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Tickets</th>
                <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Paid</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 16px" }}>{e.event_name || e.event_id}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.ticket_count}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>${e.total_paid?.toFixed(2)}</td>
                  <td style={{ padding: "10px 16px" }}>{e.purchase_date ? new Date(e.purchase_date).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#9ca3af" }}>No event history</div>
        )}
      </div>
    </div>
  );
}
