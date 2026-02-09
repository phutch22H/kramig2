// ─── Shared Types ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status: number;
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

// ─── Organisation Types ─────────────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrgRequest {
  name: string;
  slug?: string;
}

export interface UpdateOrgRequest {
  name?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: "admin" | "member" | "viewer";
}

export interface OrgMember {
  id: string;
  user_id: string;
  org_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  email: string;
  full_name: string;
  joined_at: string;
}

export interface UpdateMemberRoleRequest {
  role: "admin" | "member" | "viewer";
}

// ─── Event Types ────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  date: string;
  status: "draft" | "on_sale" | "sold_out" | "completed" | "cancelled";
  total_capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  venue?: string;
  city?: string;
  country?: string;
  date: string;
  status?: string;
  total_capacity?: number;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  venue?: string;
  city?: string;
  country?: string;
  date?: string;
  status?: string;
  total_capacity?: number;
}

export interface EventArtist {
  id: string;
  event_id: string;
  name: string;
  role: string | null;
}

export interface AddArtistRequest {
  name: string;
  role?: string;
}

export interface SellerLink {
  id: string;
  event_id: string;
  seller_id: string;
  seller_name: string;
  external_event_id: string | null;
  status: string;
  linked_at: string;
}

export interface LinkSellerRequest {
  seller_id: string;
  external_event_id?: string;
}

// ─── Ticket Types ───────────────────────────────────────────────────────────

export interface TicketDashboard {
  total_sold: number;
  total_revenue: number;
  by_event: TicketEventSummary[];
}

export interface TicketEventSummary {
  event_id: string;
  event_name: string;
  sold: number;
  revenue: number;
  currency: string;
}

export interface TicketRecord {
  id: string;
  event_id: string;
  order_id: string;
  seller: string;
  customer_email: string | null;
  quantity: number;
  face_value: number;
  currency: string;
  sold_at: string;
}

export interface TicketHistoryEntry {
  date: string;
  sold: number;
  revenue: number;
}

// ─── Customer Types ─────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  tags: string[];
  total_spent: number;
  ticket_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  email: string;
  full_name?: string;
  phone?: string;
  tags?: string[];
}

export interface UpdateCustomerRequest {
  full_name?: string;
  phone?: string;
  tags?: string[];
}

export interface CustomerEvent {
  event_id: string;
  event_name: string;
  tickets: number;
  spent: number;
}

export interface BulkTagRequest {
  customer_ids: string[];
  tags: string[];
}

// ─── Financial Types ────────────────────────────────────────────────────────

export interface FinancialSummary {
  total_revenue: number;
  total_fees: number;
  total_settlements: number;
  pending_settlements: number;
  currency: string;
  by_event: EventFinancialSummary[];
}

export interface EventFinancialSummary {
  event_id: string;
  event_name: string;
  revenue: number;
  fees: number;
  net: number;
}

export interface FinancialRecord {
  id: string;
  org_id: string;
  event_id: string | null;
  type: "revenue" | "fee" | "settlement" | "refund" | "adjustment";
  amount: number;
  currency: string;
  description: string | null;
  reference: string | null;
  date: string;
  created_at: string;
}

export interface CreateFinancialRecordRequest {
  event_id?: string;
  type: "revenue" | "fee" | "settlement" | "refund" | "adjustment";
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
  date: string;
}

export interface UpdateFinancialRecordRequest {
  type?: string;
  amount?: number;
  currency?: string;
  description?: string;
  reference?: string;
  date?: string;
}

export interface PendingSettlement {
  event_id: string;
  event_name: string;
  amount: number;
  currency: string;
}

// ─── Connector Types ────────────────────────────────────────────────────────

export interface Seller {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  last_sync: string | null;
}

export interface ConnectSellerRequest {
  api_key: string;
  api_secret?: string;
  webhook_url?: string;
}

export interface ConnectorStatus {
  seller_id: string;
  seller_name: string;
  connected: boolean;
  last_sync: string | null;
  events_synced: number;
  tickets_synced: number;
}

export interface ConnectorTestResult {
  success: boolean;
  message: string;
  latency_ms: number;
}

// ─── Sharing Types ──────────────────────────────────────────────────────────

export interface ShareGrant {
  id: string;
  org_id: string;
  event_id: string;
  granted_to_email: string;
  permissions: string[];
  created_at: string;
  expires_at: string | null;
}

export interface GrantShareRequest {
  event_id: string;
  email: string;
  permissions: string[];
  expires_at?: string;
}

// ─── Public Types ───────────────────────────────────────────────────────────

export interface PublicEvent {
  id: string;
  name: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  date: string;
  artists: { name: string; role: string | null }[];
  status: string;
}

export interface PublicEventDetail extends PublicEvent {
  ticket_tiers: {
    name: string;
    price: number;
    currency: string;
    available: boolean;
  }[];
}

// ─── Query Params ───────────────────────────────────────────────────────────

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface TicketListParams extends ListParams {
  event_id?: string;
  seller?: string;
}

export interface FinancialListParams extends ListParams {
  event_id?: string;
  type?: string;
  from_date?: string;
  to_date?: string;
}

export interface PublicBrowseParams {
  page?: number;
  per_page?: number;
  city?: string;
  country?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

// ─── API Client ─────────────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => Promise<string | null>;
  private orgId: string | null = null;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.getToken = getToken;
  }

  setOrgId(orgId: string | null) {
    this.orgId = orgId;
  }

  private buildQuery(params?: Record<string, unknown>): string {
    if (!params) return "";
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null,
    );
    if (entries.length === 0) return "";
    const qs = entries
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join("&");
    return `?${qs}`;
  }

  private async _fetch<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      orgScoped?: boolean;
      query?: Record<string, unknown>;
      raw?: boolean;
    },
  ): Promise<T> {
    const url = `${this.baseUrl}${path}${this.buildQuery(options?.query)}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = await this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (options?.orgScoped !== false && this.orgId) {
      headers["X-Org-Id"] = this.orgId;
    }

    const fetchOptions: RequestInit = { method, headers };
    if (options?.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    if (options?.raw) {
      return response as unknown as T;
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // use statusText
      }
      throw new ApiClientError(response.status, detail);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  auth = {
    login: (data: LoginRequest) =>
      this._fetch<AuthTokens>("POST", "/api/v1/auth/login", {
        body: data,
        orgScoped: false,
      }),

    register: (data: RegisterRequest) =>
      this._fetch<User>("POST", "/api/v1/auth/register", {
        body: data,
        orgScoped: false,
      }),

    refresh: (refreshToken: string) =>
      this._fetch<AuthTokens>("POST", "/api/v1/auth/refresh", {
        body: { refresh_token: refreshToken },
        orgScoped: false,
      }),

    logout: () =>
      this._fetch<void>("POST", "/api/v1/auth/logout", {
        orgScoped: false,
      }),

    me: () =>
      this._fetch<User>("GET", "/api/v1/auth/me", { orgScoped: false }),
  };

  // ── Organisations ───────────────────────────────────────────────────────

  orgs = {
    list: (params?: ListParams) =>
      this._fetch<PaginatedResponse<Organisation>>(
        "GET",
        "/api/v1/orgs",
        { query: params as Record<string, unknown>, orgScoped: false },
      ),

    create: (data: CreateOrgRequest) =>
      this._fetch<Organisation>("POST", "/api/v1/orgs", {
        body: data,
        orgScoped: false,
      }),

    get: (orgId: string) =>
      this._fetch<Organisation>("GET", `/api/v1/orgs/${orgId}`, {
        orgScoped: false,
      }),

    update: (orgId: string, data: UpdateOrgRequest) =>
      this._fetch<Organisation>("PATCH", `/api/v1/orgs/${orgId}`, {
        body: data,
        orgScoped: false,
      }),

    delete: (orgId: string) =>
      this._fetch<void>("DELETE", `/api/v1/orgs/${orgId}`, {
        orgScoped: false,
      }),

    invite: (orgId: string, data: InviteMemberRequest) =>
      this._fetch<OrgMember>("POST", `/api/v1/orgs/${orgId}/members`, {
        body: data,
        orgScoped: false,
      }),

    listMembers: (orgId: string, params?: ListParams) =>
      this._fetch<PaginatedResponse<OrgMember>>(
        "GET",
        `/api/v1/orgs/${orgId}/members`,
        { query: params as Record<string, unknown>, orgScoped: false },
      ),

    updateRole: (orgId: string, memberId: string, data: UpdateMemberRoleRequest) =>
      this._fetch<OrgMember>(
        "PATCH",
        `/api/v1/orgs/${orgId}/members/${memberId}`,
        { body: data, orgScoped: false },
      ),

    removeMember: (orgId: string, memberId: string) =>
      this._fetch<void>(
        "DELETE",
        `/api/v1/orgs/${orgId}/members/${memberId}`,
        { orgScoped: false },
      ),
  };

  // ── Events ──────────────────────────────────────────────────────────────

  events = {
    list: (params?: ListParams) =>
      this._fetch<PaginatedResponse<Event>>("GET", "/api/v1/events", {
        query: params as Record<string, unknown>,
      }),

    create: (data: CreateEventRequest) =>
      this._fetch<Event>("POST", "/api/v1/events", { body: data }),

    get: (eventId: string) =>
      this._fetch<Event>("GET", `/api/v1/events/${eventId}`),

    update: (eventId: string, data: UpdateEventRequest) =>
      this._fetch<Event>("PATCH", `/api/v1/events/${eventId}`, {
        body: data,
      }),

    delete: (eventId: string) =>
      this._fetch<void>("DELETE", `/api/v1/events/${eventId}`),

    addArtist: (eventId: string, data: AddArtistRequest) =>
      this._fetch<EventArtist>("POST", `/api/v1/events/${eventId}/artists`, {
        body: data,
      }),

    listArtists: (eventId: string) =>
      this._fetch<EventArtist[]>("GET", `/api/v1/events/${eventId}/artists`),

    removeArtist: (eventId: string, artistId: string) =>
      this._fetch<void>(
        "DELETE",
        `/api/v1/events/${eventId}/artists/${artistId}`,
      ),

    linkSeller: (eventId: string, data: LinkSellerRequest) =>
      this._fetch<SellerLink>("POST", `/api/v1/events/${eventId}/sellers`, {
        body: data,
      }),

    listSellerLinks: (eventId: string) =>
      this._fetch<SellerLink[]>("GET", `/api/v1/events/${eventId}/sellers`),

    unlinkSeller: (eventId: string, sellerId: string) =>
      this._fetch<void>(
        "DELETE",
        `/api/v1/events/${eventId}/sellers/${sellerId}`,
      ),
  };

  // ── Tickets ─────────────────────────────────────────────────────────────

  tickets = {
    dashboard: (params?: { event_id?: string }) =>
      this._fetch<TicketDashboard>("GET", "/api/v1/tickets/dashboard", {
        query: params as Record<string, unknown>,
      }),

    latest: (params?: TicketListParams) =>
      this._fetch<PaginatedResponse<TicketRecord>>(
        "GET",
        "/api/v1/tickets/latest",
        { query: params as Record<string, unknown> },
      ),

    history: (params?: { event_id?: string; granularity?: "day" | "week" | "month" }) =>
      this._fetch<TicketHistoryEntry[]>("GET", "/api/v1/tickets/history", {
        query: params as Record<string, unknown>,
      }),

    triggerPoll: () =>
      this._fetch<{ message: string }>("POST", "/api/v1/tickets/poll"),
  };

  // ── Customers ───────────────────────────────────────────────────────────

  customers = {
    list: (params?: ListParams) =>
      this._fetch<PaginatedResponse<Customer>>(
        "GET",
        "/api/v1/customers",
        { query: params as Record<string, unknown> },
      ),

    create: (data: CreateCustomerRequest) =>
      this._fetch<Customer>("POST", "/api/v1/customers", { body: data }),

    get: (customerId: string) =>
      this._fetch<Customer>("GET", `/api/v1/customers/${customerId}`),

    update: (customerId: string, data: UpdateCustomerRequest) =>
      this._fetch<Customer>("PATCH", `/api/v1/customers/${customerId}`, {
        body: data,
      }),

    delete: (customerId: string) =>
      this._fetch<void>("DELETE", `/api/v1/customers/${customerId}`),

    customerEvents: (customerId: string) =>
      this._fetch<CustomerEvent[]>(
        "GET",
        `/api/v1/customers/${customerId}/events`,
      ),

    bulkTag: (data: BulkTagRequest) =>
      this._fetch<{ updated: number }>("POST", "/api/v1/customers/bulk-tag", {
        body: data,
      }),

    importCsv: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return this._fetchFormData<{ imported: number; errors: string[] }>(
        "POST",
        "/api/v1/customers/import",
        formData,
      );
    },

    exportCsv: () =>
      this._fetch<Response>("GET", "/api/v1/customers/export", { raw: true }),
  };

  // ── Financials ──────────────────────────────────────────────────────────

  financials = {
    summary: (params?: { event_id?: string; from_date?: string; to_date?: string }) =>
      this._fetch<FinancialSummary>("GET", "/api/v1/financials/summary", {
        query: params as Record<string, unknown>,
      }),

    create: (data: CreateFinancialRecordRequest) =>
      this._fetch<FinancialRecord>("POST", "/api/v1/financials", {
        body: data,
      }),

    get: (recordId: string) =>
      this._fetch<FinancialRecord>("GET", `/api/v1/financials/${recordId}`),

    update: (recordId: string, data: UpdateFinancialRecordRequest) =>
      this._fetch<FinancialRecord>(
        "PATCH",
        `/api/v1/financials/${recordId}`,
        { body: data },
      ),

    delete: (recordId: string) =>
      this._fetch<void>("DELETE", `/api/v1/financials/${recordId}`),

    pendingSettlements: () =>
      this._fetch<PendingSettlement[]>(
        "GET",
        "/api/v1/financials/pending-settlements",
      ),

    exportCsv: (params?: { event_id?: string; from_date?: string; to_date?: string }) =>
      this._fetch<Response>("GET", "/api/v1/financials/export", {
        query: params as Record<string, unknown>,
        raw: true,
      }),
  };

  // ── Connectors ──────────────────────────────────────────────────────────

  connectors = {
    listSellers: () =>
      this._fetch<Seller[]>("GET", "/api/v1/connectors/sellers"),

    connect: (sellerId: string, data: ConnectSellerRequest) =>
      this._fetch<ConnectorStatus>(
        "POST",
        `/api/v1/connectors/sellers/${sellerId}/connect`,
        { body: data },
      ),

    status: (sellerId: string) =>
      this._fetch<ConnectorStatus>(
        "GET",
        `/api/v1/connectors/sellers/${sellerId}/status`,
      ),

    test: (sellerId: string) =>
      this._fetch<ConnectorTestResult>(
        "POST",
        `/api/v1/connectors/sellers/${sellerId}/test`,
      ),

    disconnect: (sellerId: string) =>
      this._fetch<void>(
        "DELETE",
        `/api/v1/connectors/sellers/${sellerId}/connect`,
      ),

    syncEvents: (sellerId: string) =>
      this._fetch<{ synced: number }>(
        "POST",
        `/api/v1/connectors/sellers/${sellerId}/sync`,
      ),
  };

  // ── Sharing ─────────────────────────────────────────────────────────────

  sharing = {
    list: (params?: { event_id?: string }) =>
      this._fetch<ShareGrant[]>("GET", "/api/v1/sharing", {
        query: params as Record<string, unknown>,
      }),

    grant: (data: GrantShareRequest) =>
      this._fetch<ShareGrant>("POST", "/api/v1/sharing", { body: data }),

    revoke: (grantId: string) =>
      this._fetch<void>("DELETE", `/api/v1/sharing/${grantId}`),
  };

  // ── Public ──────────────────────────────────────────────────────────────

  public = {
    browseEvents: (params?: PublicBrowseParams) =>
      this._fetch<PaginatedResponse<PublicEvent>>(
        "GET",
        "/api/v1/public/events",
        { query: params as Record<string, unknown>, orgScoped: false },
      ),

    eventDetail: (eventId: string) =>
      this._fetch<PublicEventDetail>(
        "GET",
        `/api/v1/public/events/${eventId}`,
        { orgScoped: false },
      ),
  };

  // ── Internal helpers ────────────────────────────────────────────────────

  private async _fetchFormData<T>(
    method: string,
    path: string,
    formData: FormData,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {};

    const token = await this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (this.orgId) {
      headers["X-Org-Id"] = this.orgId;
    }

    const response = await fetch(url, { method, headers, body: formData });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // use statusText
      }
      throw new ApiClientError(response.status, detail);
    }

    return response.json() as Promise<T>;
  }
}

// ─── Convenience factory ────────────────────────────────────────────────────

export function createApiClient(
  baseUrl: string,
  getToken: () => Promise<string | null>,
): ApiClient {
  return new ApiClient(baseUrl, getToken);
}
