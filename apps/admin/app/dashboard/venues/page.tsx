"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formError, setFormError] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(null);

  useEffect(() => {
    loadVenues();
  }, [page]);

  function loadVenues() {
    setLoading(true);
    api.listVenueDirectory({ search: search || undefined, page, page_size: 50 })
      .then((data: any) => {
        setVenues(data.items || []);
        setTotalPages(data.total_pages || 0);
        setTotal(data.total || 0);
      })
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }

  function handleSearch() {
    setPage(1);
    loadVenues();
  }

  function resetForm() {
    setFormName(""); setFormAddress(""); setFormCity(""); setFormCountry("");
    setFormCapacity(""); setFormError(""); setEditingId(null); setShowForm(false);
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError("Name is required"); return; }
    setFormError("");
    try {
      const data: any = {
        name: formName.trim(),
        address: formAddress.trim() || undefined,
        city: formCity.trim() || undefined,
        country: formCountry.trim() || undefined,
        capacity: formCapacity ? parseInt(formCapacity) : undefined,
      };
      if (editingId) {
        await api.updateVenueDirectory(editingId, data);
      } else {
        await api.createVenueDirectory(data);
      }
      resetForm();
      loadVenues();
    } catch (err: any) {
      setFormError(err.message);
    }
  }

  function startEdit(v: any) {
    setEditingId(v.id);
    setFormName(v.name);
    setFormAddress(v.address || "");
    setFormCity(v.city || "");
    setFormCountry(v.country || "");
    setFormCapacity(v.capacity ? String(v.capacity) : "");
    setFormError("");
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this venue?")) return;
    await api.deleteVenueDirectory(id);
    loadVenues();
  }

  async function handleBulkImport() {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const venues = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { name: parts[0], address: parts[1] || undefined, city: parts[2] || undefined, country: parts[3] || undefined };
    }).filter(v => v.name);
    try {
      const result = await api.bulkCreateVenues(venues);
      setBulkResult(result);
      setBulkText("");
      loadVenues();
    } catch (err: any) {
      setFormError(err.message);
    }
  }

  const btnStyle: React.CSSProperties = { padding: "6px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", background: "white", cursor: "pointer", fontSize: "12px" };
  const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", width: "100%", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search venues..." style={{ padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", width: "220px" }} />
          <button onClick={handleSearch} style={btnStyle}>Search</button>
          <span style={{ fontSize: "12px", color: "#a3a3a3" }}>{total} venues</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ ...btnStyle, background: "#2563eb", color: "white", border: "none" }}>+ Add Venue</button>
          <button onClick={() => { setShowBulk(!showBulk); setBulkResult(null); }} style={btnStyle}>Bulk Import</button>
        </div>
      </div>

      {showBulk && (
        <div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px", marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
            Paste venues (one per line: name, address, city, country)
          </label>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={6}
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical", fontFamily: "monospace" }}
            placeholder={"Alexandra Palace, Alexandra Palace Way London N22 7AY, London, United Kingdom\nBrixton Academy, 211 Stockwell Rd London SW9, London, United Kingdom"} />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "8px", alignItems: "center" }}>
            <button onClick={handleBulkImport} style={{ ...btnStyle, background: "#2563eb", color: "white", border: "none" }}>Import</button>
            <button onClick={() => setShowBulk(false)} style={btnStyle}>Cancel</button>
            {bulkResult && <span style={{ fontSize: "12px", color: "#00d97e" }}>Created {bulkResult.created}, skipped {bulkResult.skipped}</span>}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{editingId ? "Edit Venue" : "Add Venue"}</h3>
          {formError && <div style={{ background: "#fef2f2", color: "#ff3b3b", padding: "8px 12px", borderRadius: "4px", marginBottom: "12px", fontSize: "13px" }}>{formError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Name *</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} style={inputStyle} placeholder="Venue name" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Address</label>
              <input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} style={inputStyle} placeholder="Full address" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>City</label>
              <input value={formCity} onChange={(e) => setFormCity(e.target.value)} style={inputStyle} placeholder="e.g. London" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Country</label>
              <input value={formCountry} onChange={(e) => setFormCountry(e.target.value)} style={inputStyle} placeholder="e.g. United Kingdom" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Capacity</label>
              <input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} style={inputStyle} placeholder="e.g. 5000" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleSave} style={{ ...btnStyle, background: "#2563eb", color: "white", border: "none" }}>{editingId ? "Update" : "Create"}</button>
            <button onClick={resetForm} style={btnStyle}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "6px", border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", fontSize: "11px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>City</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Country</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Address</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 500 }}>{v.name}</td>
                <td style={{ padding: "10px 16px" }}>
                  {v.city && <span style={{ display: "inline-block", padding: "2px 8px", background: "#dbeafe", color: "#2563eb", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>{v.city}</span>}
                </td>
                <td style={{ padding: "10px 16px", fontSize: "12px", color: "#a3a3a3" }}>{v.country || "\u2014"}</td>
                <td style={{ padding: "10px 16px", fontSize: "12px", color: "#6b7280", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.address || "\u2014"}</td>
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  <button onClick={() => startEdit(v)} style={{ ...btnStyle, marginRight: "4px" }}>Edit</button>
                  <button onClick={() => handleDelete(v.id)} style={{ ...btnStyle, color: "#ff3b3b", borderColor: "#fecaca" }}>Delete</button>
                </td>
              </tr>
            ))}
            {venues.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a3a3a3" }}>No venues found</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a3a3a3" }}>Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "16px" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ ...btnStyle, background: p === page ? "#2563eb" : "white", color: p === page ? "white" : undefined, border: p === page ? "none" : "1px solid #d4d4d4", minWidth: "32px" }}>
              {p}
            </button>
          ))}
          {totalPages > 10 && <span style={{ padding: "6px", fontSize: "12px", color: "#a3a3a3" }}>...</span>}
        </div>
      )}
    </div>
  );
}
