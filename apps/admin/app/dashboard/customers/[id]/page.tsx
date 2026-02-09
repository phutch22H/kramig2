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

  const inputStyle = { width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", boxSizing: "border-box" as const };
  const sectionStyle = { background: "white", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1.5rem" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{customer.email}</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} style={{ padding: "0.375rem 0.75rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Edit</button>
                <button onClick={handleDelete} style={{ padding: "0.375rem 0.75rem", background: "#dc2626", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
              </>
            ) : (
              <>
                <button onClick={handleSave} style={{ padding: "0.375rem 0.75rem", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Save</button>
                <button onClick={() => { setEditing(false); setForm(customer); }} style={{ padding: "0.375rem 0.75rem", background: "#6b7280", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div><label style={{ fontSize: "0.75rem", color: "#6b7280" }}>First Name</label><input style={inputStyle} value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.75rem", color: "#6b7280" }}>Last Name</label><input style={inputStyle} value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.75rem", color: "#6b7280" }}>Phone</label><input style={inputStyle} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label style={{ fontSize: "0.75rem", color: "#6b7280" }}>City</label><input style={inputStyle} value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: "0.75rem", color: "#6b7280" }}>Notes</label><textarea style={{ ...inputStyle, minHeight: "60px" }} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
              <span key={t} style={{ display: "inline-block", padding: "0.125rem 0.375rem", background: "#e0e7ff", color: "#3730a3", borderRadius: "4px", fontSize: "0.7rem", marginRight: "0.25rem" }}>{t}</span>
            ))}</div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <h3 style={{ fontWeight: 600, marginBottom: "0.75rem" }}>Event History</h3>
        {events.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "#f9fafb", color: "#6b7280" }}>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Event</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Tickets</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Paid</th>
                <th style={{ padding: "0.5rem", textAlign: "left" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.5rem" }}>{e.event_name || e.event_id}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{e.ticket_count}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>${e.total_paid?.toFixed(2)}</td>
                  <td style={{ padding: "0.5rem" }}>{e.purchase_date ? new Date(e.purchase_date).toLocaleDateString() : "—"}</td>
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
