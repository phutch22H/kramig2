"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
      <div style={{ background: "white", padding: "32px", borderRadius: "6px", border: "1px solid #e5e5e5", width: "100%", maxWidth: "400px" }}>
        <div style={{ width: "40px", height: "3px", background: "#2563eb", marginBottom: "20px" }} />
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>Ticketing Admin</h1>
        {error && <div style={{ background: "#fef2f2", color: "#ff3b3b", padding: "0.75rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3", marginBottom: "0.25rem" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#a3a3a3", marginBottom: "0.25rem" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #d4d4d4", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "0.625rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", fontSize: "0.875rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
