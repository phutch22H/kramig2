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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ background: "white", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", textAlign: "center" }}>Ticketing Admin</h1>
        {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.875rem" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.875rem", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "0.625rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
