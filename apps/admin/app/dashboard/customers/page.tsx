"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadCustomers();
  }, []);

  function loadCustomers() {
    setLoading(true);
    api.listCustomers({ search: search || undefined })
      .then(setCustomers)
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await api.importCsv(file);
    loadCustomers();
  }

  async function handleExport() {
    const blob = await api.exportCustomersCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
  }

  async function handleBulkTag() {
    if (!tagInput.trim() || selected.size === 0) return;
    await api.bulkTag({ customer_ids: Array.from(selected), tags: [tagInput.trim()], action: "add" });
    setTagInput("");
    setSelected(new Set());
    loadCustomers();
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const btnStyle = { padding: "0.375rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", background: "white", cursor: "pointer", fontSize: "0.8rem" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
            placeholder="Search customers..." style={{ padding: "0.375rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", width: "250px" }} />
          <button onClick={loadCustomers} style={btnStyle}>Search</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input type="file" ref={fileRef} accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>Import CSV</button>
          <button onClick={handleExport} style={btnStyle}>Export CSV</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem", padding: "0.75rem", background: "#eef2ff", borderRadius: "6px" }}>
          <span style={{ fontSize: "0.875rem" }}>{selected.size} selected</span>
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Tag name" style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.8rem" }} />
          <button onClick={handleBulkTag} style={{ ...btnStyle, background: "#6366f1", color: "white", border: "none" }}>Add Tag</button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>
              <th style={{ padding: "0.75rem 0.5rem", width: "32px" }}></th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left" }}>Email</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "left" }}>Tags</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Events</th>
              <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Spend</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f3f4f6", cursor: "pointer" }}
                onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                <td style={{ padding: "0.5rem", textAlign: "center" }} onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}>
                  <input type="checkbox" checked={selected.has(c.id)} readOnly />
                </td>
                <td style={{ padding: "0.5rem", fontSize: "0.875rem" }}>{c.email}</td>
                <td style={{ padding: "0.5rem", fontSize: "0.875rem" }}>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</td>
                <td style={{ padding: "0.5rem" }}>
                  {(c.tags || []).map((t: string) => (
                    <span key={t} style={{ display: "inline-block", padding: "0.125rem 0.375rem", background: "#e0e7ff", color: "#3730a3", borderRadius: "4px", fontSize: "0.7rem", marginRight: "0.25rem" }}>{t}</span>
                  ))}
                </td>
                <td style={{ padding: "0.5rem", textAlign: "right", fontSize: "0.875rem" }}>{c.total_events_attended}</td>
                <td style={{ padding: "0.5rem", textAlign: "right", fontSize: "0.875rem" }}>${c.total_spend?.toFixed(2)}</td>
              </tr>
            ))}
            {customers.length === 0 && !loading && (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
