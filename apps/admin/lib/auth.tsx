"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }, []);

  const getRefreshToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  }, []);

  const fetchUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      const u = await fetchUser(data.access_token);
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getRefreshToken, fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    const u = await fetchUser(data.access_token);
    setUser(u);
  }, [fetchUser]);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("current_org_id");
    setUser(null);
  }, [getRefreshToken]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchUser(token).then((u) => {
        if (u) {
          setUser(u);
          setIsLoading(false);
        } else {
          refresh();
        }
      });
    } else {
      refresh();
    }
  }, [getToken, fetchUser, refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
