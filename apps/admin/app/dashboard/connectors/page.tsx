"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ConnectorsPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectForm, setConnectForm] = useState<{ sellerId: string; apiKey: string; apiSecret: string } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

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

  const inputStyle = { width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", boxSizing: "border-box" as const };

  return (
    <div style={{ maxWidth: "700px" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Ticket Seller Connections</h2>

      {sellers.map((seller) => {
        const status = getStatus(seller.id);
        const isConnecting = connectForm?.sellerId === seller.id;

        return (
          <div key={seller.id} style={{ background: "white", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>{seller.name}</h3>
                {seller.website_url && <a href={seller.website_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#6366f1" }}>{seller.website_url}</a>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {status?.is_connected && status?.is_active ? (
                  <>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: status.last_test_success ? "#16a34a" : "#f59e0b" }} />
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {status.last_test_success ? "Connected" : "Connection issue"}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Not connected</span>
                )}
              </div>
            </div>

            {status?.last_tested_at && (
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
                Last tested: {new Date(status.last_tested_at).toLocaleString()}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              {status?.is_connected && status?.is_active ? (
                <>
                  <button onClick={() => handleTest(seller.id)} disabled={testing === seller.id}
                    style={{ padding: "0.375rem 0.75rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                    {testing === seller.id ? "Testing..." : "Test Connection"}
                  </button>
                  <button onClick={() => handleDisconnect(seller.id)}
                    style={{ padding: "0.375rem 0.75rem", background: "white", color: "#dc2626", border: "1px solid #dc2626", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                    Disconnect
                  </button>
                </>
              ) : (
                <button onClick={() => setConnectForm({ sellerId: seller.id, apiKey: "", apiSecret: "" })}
                  style={{ padding: "0.375rem 0.75rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                  Connect
                </button>
              )}
            </div>

            {isConnecting && connectForm && (
              <form onSubmit={handleConnect} style={{ marginTop: "1rem", padding: "1rem", background: "#f9fafb", borderRadius: "6px" }}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "0.25rem" }}>API Key</label>
                  <input style={inputStyle} value={connectForm.apiKey} onChange={(e) => setConnectForm({ ...connectForm, apiKey: e.target.value })} required />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 500, display: "block", marginBottom: "0.25rem" }}>API Secret (optional)</label>
                  <input style={inputStyle} type="password" value={connectForm.apiSecret} onChange={(e) => setConnectForm({ ...connectForm, apiSecret: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit" style={{ padding: "0.375rem 1rem", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Connect & Test</button>
                  <button type="button" onClick={() => setConnectForm(null)} style={{ padding: "0.375rem 1rem", background: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        );
      })}

      {sellers.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", padding: "2rem" }}>No ticket sellers available</div>}
    </div>
  );
}
