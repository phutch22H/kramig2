"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Events", href: "/dashboard/events" },
  { label: "Tickets", href: "/dashboard/tickets" },
  { label: "Customers", href: "/dashboard/customers" },
  { label: "Financials", href: "/dashboard/financials" },
  { label: "Connectors", href: "/dashboard/connectors" },
  { label: "Artists", href: "/dashboard/artists" },
];

const orgTypes = ["promoter", "venue", "agent", "artist"];

function CreateOrgForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("promoter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const org = await api.createOrg({ name, type });
      localStorage.setItem("current_org_id", org.id);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f7" }}>
      <div style={{ background: "white", padding: "32px", borderRadius: "6px", border: "1px solid #e5e5e5", maxWidth: "400px", width: "100%" }}>
        <div style={{ width: "40px", height: "3px", background: "#2563eb", marginBottom: "20px" }} />
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Create Your Organization</h2>
        <p style={{ color: "#525252", fontSize: "0.8rem", marginBottom: "1.5rem" }}>You need an organization to get started.</p>
        {error && <div style={{ background: "#fef2f2", color: "#ff3b3b", padding: "0.75rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.8rem" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Organization Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. My Promotions Ltd" />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px", color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Type *</label>
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              {orgTypes.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "8px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>("");
  const [orgsLoaded, setOrgsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  function loadOrgs() {
    api.listOrgs().then((data) => {
      setOrgs(data);
      const saved = localStorage.getItem("current_org_id");
      if (saved && data.find((o: any) => o.id === saved)) {
        setCurrentOrgId(saved);
      } else if (data.length > 0) {
        setCurrentOrgId(data[0].id);
        localStorage.setItem("current_org_id", data[0].id);
      }
      setOrgsLoaded(true);
    }).catch(() => { setOrgsLoaded(true); });
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadOrgs();
    }
  }, [isAuthenticated]);

  function handleOrgChange(orgId: string) {
    setCurrentOrgId(orgId);
    localStorage.setItem("current_org_id", orgId);
    window.location.reload();
  }

  if (isLoading || !isAuthenticated) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  if (orgsLoaded && orgs.length === 0) {
    return <CreateOrgForm onCreated={loadOrgs} />;
  }

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: "220px", background: "#1a1a2e", color: "white", padding: 0, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #2a2a4a" }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ticketing</h2>
          <p style={{ fontSize: "0.7rem", color: "#6b7294", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
        </div>
        <nav style={{ marginTop: "8px", flex: 1 }}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}
              style={{
                display: "flex", alignItems: "center", padding: "8px 16px",
                color: isActive(item.href) ? "#ffffff" : "#8b8fb0",
                background: isActive(item.href) ? "rgba(37, 99, 235, 0.15)" : "transparent",
                borderLeft: isActive(item.href) ? "3px solid #2563eb" : "3px solid transparent",
                textDecoration: "none", fontSize: "0.8rem",
                fontWeight: isActive(item.href) ? 600 : 400,
                transition: "all 0.15s ease", letterSpacing: "0.01em",
              }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: "12px 16px" }}>
          <button onClick={logout}
            style={{ width: "100%", padding: "8px", background: "rgba(255,255,255,0.06)", color: "#8b8fb0", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", transition: "all 0.15s ease" }}>
            Sign Out
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ background: "white", borderBottom: "1px solid #e5e5e5", padding: "0 20px", height: "48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
            {navItems.find((i) => isActive(i.href))?.label || "Dashboard"}
          </h1>
          <select value={currentOrgId} onChange={(e) => handleOrgChange(e.target.value)}
            style={{ padding: "4px 8px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "0.8rem", color: "#525252" }}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </header>
        <main style={{ flex: 1, padding: "20px", background: "#f5f5f7", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
