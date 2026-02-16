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

  const inputStyle = { width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f9fafb" }}>
      <div style={{ background: "white", padding: "2rem", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", maxWidth: "400px", width: "100%" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Create Your Organization</h2>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>You need an organization to get started.</p>
        {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Organization Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. My Promotions Ltd" />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Type *</label>
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              {orgTypes.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "0.625rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
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

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: "240px", background: "#1e1b4b", color: "white", padding: "1rem 0", flexShrink: 0 }}>
        <div style={{ padding: "0 1rem 1.5rem", borderBottom: "1px solid #312e81" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Ticketing</h2>
          <p style={{ fontSize: "0.75rem", color: "#a5b4fc", marginTop: "0.25rem" }}>{user?.email}</p>
        </div>
        <nav style={{ marginTop: "1rem" }}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}
              style={{
                display: "block", padding: "0.625rem 1rem", color: pathname === item.href ? "white" : "#c7d2fe",
                background: pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "#312e81" : "transparent",
                textDecoration: "none", fontSize: "0.875rem", fontWeight: pathname === item.href ? 600 : 400,
              }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ position: "absolute", bottom: "1rem", left: 0, width: "240px", padding: "0 1rem" }}>
          <button onClick={logout}
            style={{ width: "100%", padding: "0.5rem", background: "#312e81", color: "#c7d2fe", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem" }}>
            Sign Out
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}>
            {navItems.find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.label || "Dashboard"}
          </h1>
          <select value={currentOrgId} onChange={(e) => handleOrgChange(e.target.value)}
            style={{ padding: "0.375rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem" }}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </header>
        <main style={{ flex: 1, padding: "1.5rem", background: "#f9fafb" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
