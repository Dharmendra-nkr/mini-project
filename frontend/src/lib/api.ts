const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API error");
  }
  return res.json();
}

// ---------- Rooms ----------
export interface Room {
  id: number;
  room_number: string;
  room_name: string;
  floor: number;
  view_type: string;
  capacity: number;
  base_price: number;
  amenities?: string[];
  description?: string;
  mesh_id?: string;
  wing?: string;
  room_type?: string;
  tier?: string;
  photo_urls?: string[];
  avg_rating?: number | null;
  review_count?: number;
  is_active?: boolean;
}

export interface AvailabilityRoom extends Room {
  position: { x: number; y: number; z: number };
  type: string;
  available: boolean;
}

export const rooms = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ rooms: Room[]; count: number }>(`/api/rooms/${qs}`);
  },
  detail: (id: number) => request<Room>(`/api/rooms/${id}`),
  available: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return request<{ rooms: Room[]; count: number }>(`/api/rooms/available?${qs}`);
  },
  availabilityMap: (date: string) =>
    request<{ rooms: AvailabilityRoom[]; date: string }>(
      `/api/rooms/availability-map?target_date=${date}`
    ),
};

// ---------- Bookings ----------
export interface BookingCreate {
  room_id: number;
  check_in: string;
  check_out: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone?: string;
  num_guests?: number;
  special_requests?: string;
}

export interface BookingResult {
  booking_ref: string;
  total_price: number;
  check_in: string;
  check_out: string;
  status: string;
}

export const bookings = {
  create: (data: BookingCreate) =>
    request<BookingResult>("/api/bookings/", { method: "POST", body: JSON.stringify(data) }),
  lookup: (ref: string) => request<Record<string, unknown>>(`/api/bookings/${ref}`),
  cancel: (ref: string) =>
    request<Record<string, unknown>>(`/api/bookings/${ref}`, { method: "DELETE" }),
};

// ---------- Chat ----------
export interface ChatResponse {
  session_id: string;
  message: string;
  quick_replies: string[];
  action: string | null;
}

export const chat = {
  greeting: () => request<ChatResponse>("/api/chat/greeting"),
  send: (message: string, sessionId?: string) =>
    request<ChatResponse>("/api/chat/", {
      method: "POST",
      body: JSON.stringify({ message, session_id: sessionId }),
    }),
  reset: (sessionId?: string) =>
    request<{ status: string }>("/api/chat/reset", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),
};

// ---------- Voice ----------
export const voice = {
  ttsUrl: (text: string) =>
    fetch(`${API_BASE}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then((r) => {
      if (!r.ok) throw new Error("TTS failed");
      return r.blob();
    }),
};

// ---------- Auth ----------
export const auth = {
  login: async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json() as Promise<{
      access_token: string;
      token_type: string;
      manager_name: string;
      role: string;
    }>;
  },
};

// ---------- Manager ----------
export const manager = {
  dashboard: (token: string) =>
    request<Record<string, unknown>>("/api/manager/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  bookings: (token: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ bookings: Record<string, unknown>[]; count: number }>(
      `/api/manager/bookings${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
  guests: (token: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ guests: Record<string, unknown>[]; count: number }>(
      `/api/manager/guests${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
  reviews: (token: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ reviews: Record<string, unknown>[]; count: number }>(
      `/api/manager/reviews${qs}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
  aiInsights: (token: string, question?: string) =>
    request<{ insight: string; manager: string }>("/api/manager/ai-insights", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question }),
    }),
};
