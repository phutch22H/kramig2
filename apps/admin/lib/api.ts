"use client";

import { useCallback, useMemo } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("current_org_id");
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  orgId?: string;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, orgId } = options;
  const token = getToken();
  const org = orgId || getOrgId();

  const reqHeaders: Record<string, string> = {
    ...headers,
  };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (org) {
    reqHeaders["X-Org-Id"] = org;
  }

  if (body && !(body instanceof FormData)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    let message: string;
    if (typeof err.detail === "string") {
      message = err.detail;
    } else if (Array.isArray(err.detail)) {
      message = err.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
    } else {
      message = `Request failed with status ${res.status}`;
    }
    throw new Error(message);
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) {
    return (await res.blob()) as T;
  }

  return res.json();
}

export const api = {
  // Auth
  me: () => apiRequest<{ id: string; email: string; full_name: string; is_active: boolean }>("/api/v1/auth/me"),

  // Organizations
  listOrgs: () => apiRequest<any[]>("/api/v1/orgs"),
  getOrg: (orgId: string) => apiRequest<any>(`/api/v1/orgs/${orgId}`),
  createOrg: (data: { name: string; type: string; description?: string; logo_url?: string }) =>
    apiRequest<any>("/api/v1/orgs", { method: "POST", body: data }),

  // Events
  listEvents: (params?: { status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return apiRequest<any[]>(`/api/v1/events${q ? `?${q}` : ""}`);
  },
  getEvent: (id: string) => apiRequest<any>(`/api/v1/events/${id}`),
  createEvent: (data: any) => apiRequest<any>("/api/v1/events", { method: "POST", body: data }),
  updateEvent: (id: string, data: any) => apiRequest<any>(`/api/v1/events/${id}`, { method: "PATCH", body: data }),
  deleteEvent: (id: string) => apiRequest<void>(`/api/v1/events/${id}`, { method: "DELETE" }),

  // Artists
  listArtists: (eventId: string) => apiRequest<any[]>(`/api/v1/events/${eventId}/artists`),
  addArtist: (eventId: string, data: any) => apiRequest<any>(`/api/v1/events/${eventId}/artists`, { method: "POST", body: data }),
  removeArtist: (eventId: string, artistId: string) => apiRequest<void>(`/api/v1/events/${eventId}/artists/${artistId}`, { method: "DELETE" }),

  // Seller Links
  listSellerLinks: (eventId: string) => apiRequest<any[]>(`/api/v1/events/${eventId}/sellers`),
  addSellerLink: (eventId: string, data: any) => apiRequest<any>(`/api/v1/events/${eventId}/sellers`, { method: "POST", body: data }),
  removeSellerLink: (eventId: string, linkId: string) => apiRequest<void>(`/api/v1/events/${eventId}/sellers/${linkId}`, { method: "DELETE" }),

  // Tickets
  ticketDashboard: () => apiRequest<any>("/api/v1/tickets/dashboard"),
  latestCounts: (eventId: string) => apiRequest<any[]>(`/api/v1/tickets/${eventId}/latest`),
  ticketHistory: (eventId: string, params?: { seller_id?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.seller_id) qs.set("seller_id", params.seller_id);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return apiRequest<any[]>(`/api/v1/tickets/${eventId}/history${q ? `?${q}` : ""}`);
  },
  triggerPoll: (eventId: string) => apiRequest<any>(`/api/v1/tickets/${eventId}/poll`, { method: "POST" }),

  // Customers
  listCustomers: (params?: { search?: string; tag?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.tag) qs.set("tag", params.tag);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return apiRequest<any[]>(`/api/v1/customers${q ? `?${q}` : ""}`);
  },
  getCustomer: (id: string) => apiRequest<any>(`/api/v1/customers/${id}`),
  createCustomer: (data: any) => apiRequest<any>("/api/v1/customers", { method: "POST", body: data }),
  updateCustomer: (id: string, data: any) => apiRequest<any>(`/api/v1/customers/${id}`, { method: "PATCH", body: data }),
  deleteCustomer: (id: string) => apiRequest<void>(`/api/v1/customers/${id}`, { method: "DELETE" }),
  customerEvents: (id: string) => apiRequest<any[]>(`/api/v1/customers/${id}/events`),
  bulkTag: (data: { customer_ids: string[]; tags: string[]; action: "add" | "remove" }) =>
    apiRequest<any>("/api/v1/customers/bulk-tag", { method: "POST", body: data }),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<any>("/api/v1/customers/import-csv", { method: "POST", body: formData });
  },
  exportCustomersCsv: () => apiRequest<Blob>("/api/v1/customers/export/csv"),

  // Financials
  financialSummary: (eventId?: string) => {
    const qs = eventId ? `?event_id=${eventId}` : "";
    return apiRequest<any>(`/api/v1/financials/summary${qs}`);
  },
  createFinancialReport: (data: any) => apiRequest<any>("/api/v1/financials", { method: "POST", body: data }),
  exportFinancialsCsv: (eventId?: string) => {
    const qs = eventId ? `?event_id=${eventId}` : "";
    return apiRequest<Blob>(`/api/v1/financials/export/csv${qs}`);
  },

  // Artist Directory
  listArtistDirectory: (params?: { search?: string; page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const q = qs.toString();
    return apiRequest<any>(`/api/v1/artists${q ? `?${q}` : ""}`);
  },
  getArtistDirectory: (id: string) => apiRequest<any>(`/api/v1/artists/${id}`),
  createArtistDirectory: (data: { name: string; image_url?: string; genre?: string }) =>
    apiRequest<any>("/api/v1/artists", { method: "POST", body: data }),
  updateArtistDirectory: (id: string, data: { name?: string; image_url?: string; genre?: string }) =>
    apiRequest<any>(`/api/v1/artists/${id}`, { method: "PATCH", body: data }),
  deleteArtistDirectory: (id: string) => apiRequest<void>(`/api/v1/artists/${id}`, { method: "DELETE" }),
  bulkCreateArtists: (artists: { name: string; image_url?: string; genre?: string }[]) =>
    apiRequest<{ created: number; skipped: number }>("/api/v1/artists/bulk", { method: "POST", body: { artists } }),

  // Venue Directory
  listVenueDirectory: (params?: { search?: string; page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const q = qs.toString();
    return apiRequest<any>(`/api/v1/venues${q ? `?${q}` : ""}`);
  },
  getVenueDirectory: (id: string) => apiRequest<any>(`/api/v1/venues/${id}`),
  createVenueDirectory: (data: { name: string; address?: string; city?: string; country?: string; image_url?: string; capacity?: number }) =>
    apiRequest<any>("/api/v1/venues", { method: "POST", body: data }),
  updateVenueDirectory: (id: string, data: { name?: string; address?: string; city?: string; country?: string; image_url?: string; capacity?: number }) =>
    apiRequest<any>(`/api/v1/venues/${id}`, { method: "PATCH", body: data }),
  deleteVenueDirectory: (id: string) => apiRequest<void>(`/api/v1/venues/${id}`, { method: "DELETE" }),
  bulkCreateVenues: (venues: { name: string; address?: string; city?: string; country?: string; image_url?: string; capacity?: number }[]) =>
    apiRequest<{ created: number; skipped: number }>("/api/v1/venues/bulk", { method: "POST", body: { venues } }),

  // Connectors
  createSeller: (data: { name: string; slug: string; website_url?: string }) =>
    apiRequest<any>("/api/v1/connectors/sellers", { method: "POST", body: data }),
  listSellers: () => apiRequest<any[]>("/api/v1/connectors/sellers"),
  connectorStatus: () => apiRequest<any[]>("/api/v1/connectors/status"),
  connectSeller: (sellerId: string, data: { api_key: string; api_secret?: string; extra?: Record<string, string> }) =>
    apiRequest<any>(`/api/v1/connectors/connect/${sellerId}`, { method: "POST", body: data }),
  testConnection: (sellerId: string) => apiRequest<any>(`/api/v1/connectors/test/${sellerId}`, { method: "POST" }),
  disconnectSeller: (sellerId: string) => apiRequest<void>(`/api/v1/connectors/disconnect/${sellerId}`, { method: "DELETE" }),
};

export function useApi() {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("current_org_id") : null;

  const apiWithOrg = useMemo(() => {
    return api;
  }, [orgId]);

  return apiWithOrg;
}
