"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formGenre, setFormGenre] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formError, setFormError] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; skipped: number } | null>(null);

  useEffect(() => {
    loadArtists();
  }, [page]);

  function loadArtists() {
    setLoading(true);
    api.listArtistDirectory({ search: search || undefined, page, page_size: 50 })
      .then((data: any) => {
        setArtists(data.items || []);
        setTotalPages(data.total_pages || 0);
        setTotal(data.total || 0);
      })
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  }

  function handleSearch() {
    setPage(1);
    loadArtists();
  }

  function resetForm() {
    setFormName("");
    setFormGenre("");
    setFormImageUrl("");
    setFormError("");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSave() {
    if (!formName.trim()) { setFormError("Name is required"); return; }
    setFormError("");
    try {
      const data = { name: formName.trim(), genre: formGenre.trim() || undefined, image_url: formImageUrl.trim() || undefined };
      if (editingId) {
        await api.updateArtistDirectory(editingId, data);
      } else {
        await api.createArtistDirectory(data);
      }
      resetForm();
      loadArtists();
    } catch (err: any) {
      setFormError(err.message);
    }
  }

  function startEdit(a: any) {
    setEditingId(a.id);
    setFormName(a.name);
    setFormGenre(a.genre || "");
    setFormImageUrl(a.image_url || "");
    setFormError("");
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this artist?")) return;
    await api.deleteArtistDirectory(id);
    loadArtists();
  }

  async function handleBulkImport() {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const artists = lines.map(line => {
      const parts = line.split(",").map(p => p.trim());
      return { name: parts[0], genre: parts[1] || undefined, image_url: parts[2] || undefined };
    }).filter(a => a.name);
    try {
      const result = await api.bulkCreateArtists(artists);
      setBulkResult(result);
      setBulkText("");
      loadArtists();
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
            placeholder="Search artists..." style={{ padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", width: "220px" }} />
          <button onClick={handleSearch} style={btnStyle}>Search</button>
          <span style={{ fontSize: "12px", color: "#a3a3a3" }}>{total} artists</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => { resetForm(); setShowForm(true); }} style={{ ...btnStyle, background: "#2563eb", color: "white", border: "none" }}>+ Add Artist</button>
          <button onClick={() => { setShowBulk(!showBulk); setBulkResult(null); }} style={btnStyle}>Bulk Import</button>
        </div>
      </div>

      {showBulk && (
        <div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px", marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
            Paste artists (one per line: name, genre, image_url)
          </label>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={6}
            style={{ ...inputStyle, minHeight: "120px", resize: "vertical", fontFamily: "monospace" }}
            placeholder={"Radiohead, Rock\nThe Weeknd, R&B\nDua Lipa, Pop"} />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "8px", alignItems: "center" }}>
            <button onClick={handleBulkImport} style={{ ...btnStyle, background: "#2563eb", color: "white", border: "none" }}>Import</button>
            <button onClick={() => setShowBulk(false)} style={btnStyle}>Cancel</button>
            {bulkResult && <span style={{ fontSize: "12px", color: "#00d97e" }}>Created {bulkResult.created}, skipped {bulkResult.skipped}</span>}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ background: "white", border: "1px solid #e5e5e5", borderRadius: "6px", padding: "16px", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{editingId ? "Edit Artist" : "Add Artist"}</h3>
          {formError && <div style={{ background: "#fef2f2", color: "#ff3b3b", padding: "8px 12px", borderRadius: "4px", marginBottom: "12px", fontSize: "13px" }}>{formError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Name *</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} style={inputStyle} placeholder="Artist name" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Genre</label>
              <input value={formGenre} onChange={(e) => setFormGenre(e.target.value)} style={inputStyle} placeholder="e.g. Rock, Pop" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Image URL</label>
              <input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
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
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Slug</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Genre</th>
              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>Created</th>
              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: 500 }}>{a.name}</td>
                <td style={{ padding: "10px 16px", fontSize: "12px", color: "#a3a3a3", fontFamily: "monospace" }}>{a.slug}</td>
                <td style={{ padding: "10px 16px" }}>
                  {a.genre && <span style={{ display: "inline-block", padding: "2px 8px", background: "#dbeafe", color: "#2563eb", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>{a.genre}</span>}
                </td>
                <td style={{ padding: "10px 16px", fontSize: "12px", color: "#a3a3a3", fontVariantNumeric: "tabular-nums" }}>
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                  <button onClick={() => startEdit(a)} style={{ ...btnStyle, marginRight: "4px" }}>Edit</button>
                  <button onClick={() => handleDelete(a.id)} style={{ ...btnStyle, color: "#ff3b3b", borderColor: "#fecaca" }}>Delete</button>
                </td>
              </tr>
            ))}
            {artists.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a3a3a3" }}>No artists found</td></tr>
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
