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

  const btnStyle = { padding: "0.375rem 0.75rem", border: "1px solid #d4d4d4", borderRadius: "4px", background: "white", cursor: "pointer", fontSize: "12px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadCustomers()}
            placeholder="Search customers..." style={{ padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", width: "220px" }} />
          <button onClick={loadCustomers} style={btnStyle}>Search</button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input type="file" ref={fileRef} accept=".csv" onChange={handleImport} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={btnStyle}>Import CSV</button>
          <button onClick={handleExport} style={btnStyle}>Export CSV</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem", padding: "0.75rem", background: "#eff6ff", borderRadius: "4px" }}>
          <span style={{ fontSize: "0.875rem" }}>{selected.size} selected</span>
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Tag name" style={{ padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px" }} />
          <button onClick={handleBulkTag} style={{ ...btnStyle, background: "#2563eb", color: "white", border: "none" }}>Add Tag</button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "10px 16px", width: "32px", fontWeight: 600 }}></th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Email</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Tags</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Events</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Spend</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                <td style={{ padding: "10px 16px", textAlign: "center" }} onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}>
                  <input type="checkbox" checked={selected.has(c.id)} readOnly />
                </td>
                <td style={{ padding: "10px 16px", fontSize: "0.875rem" }}>{c.email}</td>
                <td style={{ padding: "10px 16px", fontSize: "0.875rem" }}>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</td>
                <td style={{ padding: "10px 16px" }}>
                  {(c.tags || []).map((t: string) => (
                    <span key={t} style={{ display: "inline-block", padding: "0.125rem 0.375rem", background: "#dbeafe", color: "#2563eb", borderRadius: "4px", fontSize: "10px", marginRight: "0.25rem" }}>{t}</span>
                  ))}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontSize: "0.875rem", fontVariantNumeric: "tabular-nums" }}>{c.total_events_attended}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontSize: "0.875rem", fontVariantNumeric: "tabular-nums" }}>${c.total_spend?.toFixed(2)}</td>
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
