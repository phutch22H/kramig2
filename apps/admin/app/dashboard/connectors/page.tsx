"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ConnectorsPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectForm, setConnectForm] = useState<{ sellerId: string; apiKey: string; apiSecret: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSeller, setNewSeller] = useState({ name: "", slug: "", website_url: "" });
  const [addError, setAddError] = useState("");

  useEffect(() => {
    Promise.all([
      api.listSellers().catch(() => []),
      api.connectorStatus().catch(() => []),
    ]).then(([s, st]) => {
      setSellers(s);
      setStatuses(st);
      setLoading(false);
    });
  }, []);

  function getStatus(sellerId: string) {
    return statuses.find((s) => s.seller_id === sellerId);
  }

  async function handleAddSeller(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    try {
      const seller = await api.createSeller({
        name: newSeller.name.trim(),
        slug: newSeller.slug.trim() || newSeller.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        website_url: newSeller.website_url.trim() || undefined,
      });
      setSellers([...sellers, seller]);
      setNewSeller({ name: "", slug: "", website_url: "" });
      setShowAddSeller(false);
    } catch (err: any) {
      setAddError(err.message || "Failed to create seller");
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectForm) return;
    try {
      await api.connectSeller(connectForm.sellerId, {
        api_key: connectForm.apiKey,
        api_secret: connectForm.apiSecret || undefined,
      });
      const updated = await api.connectorStatus();
      setStatuses(updated);
      setConnectForm(null);
    } catch (err: any) {
      alert(err.message || "Connection failed");
    }
  }

  async function handleTest(sellerId: string) {
    setTesting(sellerId);
    try {
      const result = await api.testConnection(sellerId);
      const updated = await api.connectorStatus();
      setStatuses(updated);
      alert(result.last_test_success ? "Connection successful!" : "Connection test failed");
    } catch {
      alert("Test failed");
    } finally {
      setTesting(null);
    }
  }

  async function handleDisconnect(sellerId: string) {
    if (!confirm("Disconnect this seller?")) return;
    await api.disconnectSeller(sellerId);
    const updated = await api.connectorStatus();
    setStatuses(updated);
  }

  if (loading) return <div>Loading...</div>;

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" as const };
  const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" };

  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>Ticket Sellers</h2>
        <button onClick={() => { setShowAddSeller(!showAddSeller); setAddError(""); }}
          style={{ padding: "6px 12px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
          {showAddSeller ? "Cancel" : "+ Add Seller"}
        </button>
      </div>

      {showAddSeller && (
        <form onSubmit={handleAddSeller} style={{ background: "white", padding: "16px", borderRadius: "6px", border: "1px solid #e5e5e5", marginBottom: "12px" }}>
          {addError && <div style={{ background: "#fef2f2", color: "#ff3b3b", padding: "8px 12px", borderRadius: "4px", marginBottom: "12px", fontSize: "13px" }}>{addError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input required style={inputStyle} value={newSeller.name} onChange={(e) => setNewSeller({ ...newSeller, name: e.target.value })} placeholder="e.g. Ticketmaster" />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input style={inputStyle} value={newSeller.slug} onChange={(e) => setNewSeller({ ...newSeller, slug: e.target.value })}
                placeholder={newSeller.name ? newSeller.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "e.g. ticketmaster"} />
            </div>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input style={inputStyle} value={newSeller.website_url} onChange={(e) => setNewSeller({ ...newSeller, website_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <button type="submit" style={{ padding: "6px 16px", background: "#00d97e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Create Seller</button>
        </form>
      )}

      {sellers.map((seller) => {
        const status = getStatus(seller.id);
        const isConnecting = connectForm?.sellerId === seller.id;

        return (
          <div key={seller.id} style={{ background: "white", padding: "20px", borderRadius: "6px", border: "1px solid #e5e5e5", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: "0.9rem" }}>{seller.name}</h3>
                {seller.website_url && <a href={seller.website_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.7rem", color: "#2563eb" }}>{seller.website_url}</a>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {status?.is_connected && status?.is_active ? (
                  <>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: status.last_test_success ? "#00d97e" : "#f59e0b" }} />
                    <span style={{ fontSize: "0.75rem", color: "#525252" }}>
                      {status.last_test_success ? "Connected" : "Connection issue"}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "#a3a3a3" }}>Not connected</span>
                )}
              </div>
            </div>

            {status?.last_tested_at && (
              <div style={{ fontSize: "0.7rem", color: "#a3a3a3", marginTop: "0.5rem" }}>
                Last tested: {new Date(status.last_tested_at).toLocaleString()}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              {status?.is_connected && status?.is_active ? (
                <>
                  <button onClick={() => handleTest(seller.id)} disabled={testing === seller.id}
                    style={{ padding: "5px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500 }}>
                    {testing === seller.id ? "Testing..." : "Test Connection"}
                  </button>
                  <button onClick={() => handleDisconnect(seller.id)}
                    style={{ padding: "5px 10px", background: "white", color: "#ff3b3b", border: "1px solid #ff3b3b", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>
                    Disconnect
                  </button>
                </>
              ) : (
                <button onClick={() => setConnectForm({ sellerId: seller.id, apiKey: "", apiSecret: "" })}
                  style={{ padding: "5px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500 }}>
                  Connect
                </button>
              )}
            </div>

            {isConnecting && connectForm && (
              <form onSubmit={handleConnect} style={{ marginTop: "1rem", padding: "1rem", background: "#fafafa", borderRadius: "4px" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={labelStyle}>API Key</label>
                  <input style={inputStyle} value={connectForm.apiKey} onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })} required />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={labelStyle}>API Secret (optional)</label>
                  <input style={inputStyle} type="password" value={connectForm.apiSecret} onChange={(e) => setConnectForm({ ...connectForm, apiSecret: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit" style={{ padding: "5px 12px", background: "#00d97e", color: "#0a0a0a", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>Connect & Test</button>
                  <button type="button" onClick={() => setConnectForm(null)} style={{ padding: "5px 12px", background: "white", border: "1px solid #d4d4d4", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        );
      })}

      {sellers.length === 0 && !showAddSeller && <div style={{ color: "#a3a3a3", textAlign: "center", padding: "2rem" }}>No ticket sellers yet. Click "+ Add Seller" to create one.</div>}
    </div>
  );
}
