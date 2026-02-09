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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api.listOrgs().then((data) => {
        setOrgs(data);
        const saved = localStorage.getItem("current_org_id");
        if (saved && data.find((o: any) => o.id === saved)) {
          setCurrentOrgId(saved);
        } else if (data.length > 0) {
          setCurrentOrgId(data[0].id);
          localStorage.setItem("current_org_id", data[0].id);
        }
      }).catch(() => {});
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
