import type {
  ChatReply, ColorAnalysis, Deck, Insights, Lookbook, Product, Profile, ProfileUpdate, SavedItem, SearchParams,
  SearchResponse, StoreInfo, StoreStatus, SwipeAction,
} from "@/types/api";

/** Backend origin. Override with VITE_API_BASE_URL in frontend/.env. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const API = `${API_BASE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code: string = "error") {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("We can't reach TUFF right now. Check your connection and try again.", 0, "network");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(error?.message || `Request failed (${response.status})`, response.status, error?.code);
  }
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function searchQueryString(params: SearchParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  params.stores?.forEach((s) => query.append("store", s));
  params.styles?.forEach((s) => query.append("style", s));
  if (params.gender) query.set("gender", params.gender);
  if (params.minPrice != null) query.set("min_price", String(params.minPrice));
  if (params.maxPrice != null) query.set("max_price", String(params.maxPrice));
  if (params.userId) query.set("user_id", params.userId);
  if (params.excludeSeen) query.set("exclude_seen", "true");
  return query.toString();
}

export interface StreamHandlers {
  onStart?: (info: { query: string; stores: string[] }) => void;
  onStore: (status: StoreStatus, products: Product[]) => void;
  onDone?: (elapsedMs: number) => void;
  onError?: (error: ApiError) => void;
}

/** Search all stores and receive each store's results as soon as it answers (Server-Sent Events). */
export function streamSearch(params: SearchParams, handlers: StreamHandlers): () => void {
  const source = new EventSource(`${API}/products/search/stream?${searchQueryString(params)}`);
  let finished = false;
  source.addEventListener("start", (e) => handlers.onStart?.(JSON.parse((e as MessageEvent).data)));
  source.addEventListener("store", (e) => {
    const payload = JSON.parse((e as MessageEvent).data);
    handlers.onStore(payload.store, payload.products);
  });
  source.addEventListener("done", (e) => {
    finished = true;
    source.close();
    handlers.onDone?.(JSON.parse((e as MessageEvent).data).elapsed_ms);
  });
  source.onerror = () => {
    if (finished) return;
    source.close();
    handlers.onError?.(new ApiError("The search was interrupted. Please try again.", 0, "stream"));
  };
  return () => {
    finished = true;
    source.close();
  };
}

export const api = {
  health: () => request<{ status: string; color_analysis: string; stylist: string; stores: string[] }>("/health"),
  createUser: () => request<{ id: string }>("/users", { method: "POST" }),
  deleteUser: (userId: string) => request<void>(`/users/${userId}`, { method: "DELETE" }),
  profile: (userId: string) => request<Profile>(`/users/${userId}/profile`),
  updateProfile: (userId: string, changes: ProfileUpdate) => request<Profile>(`/users/${userId}/profile`, json("PATCH", changes)),
  analyzeFace: (photo: Blob, userId?: string | null) => {
    const form = new FormData();
    form.append("photo", photo, "portrait.jpg");
    if (userId) form.append("user_id", userId);
    return request<ColorAnalysis>("/analysis/face", { method: "POST", body: form });
  },
  search: (params: SearchParams, signal?: AbortSignal) =>
    request<SearchResponse>(`/products/search?${searchQueryString(params)}`, { signal }),
  stores: () => request<StoreInfo[]>("/products/stores"),
  interact: (userId: string, productId: string, action: SwipeAction) =>
    request<void>(`/users/${userId}/interactions`, json("POST", { product_id: productId, action })),
  undo: (userId: string) =>
    request<{ product: Product | null; action: SwipeAction | null }>(`/users/${userId}/interactions/undo`, { method: "POST" }),
  deck: (userId: string, size = 10) => request<Deck>(`/users/${userId}/deck?size=${size}`),
  lookbook: (userId: string) => request<Lookbook>(`/users/${userId}/lookbook`),
  saved: (userId: string) => request<SavedItem[]>(`/users/${userId}/saved`),
  unsave: (userId: string, productId: string) => request<void>(`/users/${userId}/saved/${productId}`, { method: "DELETE" }),
  insights: (userId: string) => request<Insights>(`/users/${userId}/insights`),
  chat: (userId: string | null, message: string) => request<ChatReply>("/stylist/chat", json("POST", { user_id: userId, message })),
};

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof ApiError ? error.message : fallback;
}
