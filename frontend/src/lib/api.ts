import type {
  ColorAnalysisResult,
  Product,
  ProfileUpdates,
  SearchFilters,
  SwipeRecord,
  TuffyUserData,
  UserAnalysis,
} from "@/types/fashion";

/** Backend base URL. Set VITE_API_BASE_URL in Frontend/TUFF-frontend/.env to override. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

/** Error carrying the backend's user-facing message and HTTP status (0 = network failure). */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Can't reach the TUFF server. Check that the backend is running.", 0);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. proxy error page); handled below.
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}

const userPath = (userId: string) => encodeURIComponent(userId);

export const api = {
  analyzeImage: (image: string) =>
    apiRequest<ColorAnalysisResult>("/analyze", { method: "POST", body: { image } }),

  searchProducts: (
    params: { userId?: string; gender?: string; brands?: string[]; filters?: SearchFilters; prompt?: string },
    signal?: AbortSignal,
  ) =>
    apiRequest<{ products: Product[]; query: string; errors: Record<string, string> }>("/scrape_products", {
      method: "POST",
      body: {
        userData: { userId: params.userId, gender: params.gender, brands: params.brands },
        filters: params.filters ?? {},
        prompt: params.prompt ?? "",
      },
      signal,
    }),

  rankProducts: (userId: string, products: Product[], options: { excludeSwiped?: boolean } = {}, signal?: AbortSignal) =>
    apiRequest<{ recommendations: Product[]; user_analysis: UserAnalysis }>("/personalized_recommendations", {
      method: "POST",
      body: { userId, products, excludeSwiped: options.excludeSwiped ?? false },
      signal,
    }),

  swipe: (userId: string, product: Product, action: "like" | "dislike") =>
    apiRequest<{ success: boolean }>("/swipe_action", { method: "POST", body: { userId, product, action } }),

  updateProfile: (userId: string, updates: ProfileUpdates) =>
    apiRequest<{ success: boolean }>("/update_user_info", { method: "POST", body: { userId, updates } }),

  homepageFeed: (userId: string) =>
    apiRequest<{
      success: boolean;
      message?: string;
      user_analysis?: UserAnalysis;
      color_analysis?: ColorAnalysisResult | null;
      recent_likes?: SwipeRecord[];
      profile?: { gender?: string; body_type?: string; style_preferences: string[] };
    }>(`/homepage_feed/${userPath(userId)}`),

  likedProducts: (userId: string) =>
    apiRequest<{ liked_products: SwipeRecord[]; count: number }>(`/liked_products/${userPath(userId)}`),

  removeLiked: (userId: string, link: string) =>
    apiRequest<{ removed: boolean }>(`/liked_products/${userPath(userId)}/remove`, { method: "POST", body: { link } }),

  tuffyChat: (userId: string, message: string, userData: TuffyUserData) =>
    apiRequest<{ success: boolean; tuffy_says: string }>("/tuffy/chat", {
      method: "POST",
      body: { userId, message, userData },
    }),

  tuffyProducts: (query: string, brand: string, gender?: string, limit = 5) =>
    apiRequest<{ products: Product[] }>("/tuffy/show_products", {
      method: "POST",
      body: { query, brand, gender, limit },
    }),
};

/** Extract a message for the UI from anything thrown by the api helpers. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Convert a saved swipe record into the product shape used by cards. */
export function swipeToProduct(record: SwipeRecord): Product {
  return {
    id: record.product_id,
    title: record.product_title,
    brand: record.product_brand,
    price: record.product_price,
    thumbnail: record.product_image,
    link: record.product_link,
    color: record.product_features?.color || null,
    category: record.product_features?.category || null,
  };
}
