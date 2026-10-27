/** Shapes returned by the TUFF API (backend/app/schemas). */

export interface Product {
  id: string;
  store: string;
  title: string;
  brand: string | null;
  price: number | null;
  mrp: number | null;
  discount_percent: number | null;
  image_url: string | null;
  url: string;
  rating: number | null;
  category: string | null;
  gender: string | null;
  color_name: string | null;
  color_hex: string | null;
  match_score: number | null;
  match_reasons: string[];
}

export interface StoreStatus {
  store: string;
  count: number;
  cached: boolean;
  elapsed_ms: number;
  error: string | null;
}

export interface SearchResponse {
  query: string;
  products: Product[];
  stores: StoreStatus[];
  elapsed_ms: number;
}

export interface Swatch {
  name: string;
  hex: string;
}

export interface SeasonResult {
  name: string;
  family: string;
  dominant: string;
  tagline: string;
  description: string;
  palette: { signature: Swatch[]; neutrals: Swatch[]; accents: Swatch[]; avoid: Swatch[]; metals: string[] };
  style_notes: string[];
  confidence: number;
}

export interface ColorAnalysis {
  season: SeasonResult;
  alternatives: { name: string; family: string; likelihood: number }[];
  skin: { hex: string; lab: number[]; ita: number; depth: string; undertone: string; hue_angle: number; chroma: number; pixels_measured: number };
  features: { eyes_hex: string | null; brows_hex: string | null; contrast: string; contrast_value: number };
  axes: { warmth: number; lightness: number; clarity: number };
  quality: { score: number; issues: string[]; white_balance: string; detector: string; faces_found: number };
  face_box: number[];
  disclaimer: string;
  elapsed_ms: number;
}

export type Gender = "women" | "men" | "unisex";

export interface Profile {
  gender: Gender | null;
  body_type: string | null;
  sizes: Record<string, string> | null;
  styles: string[];
  occasions: string[];
  favorite_stores: string[];
  budget_min: number | null;
  budget_max: number | null;
  season: string | null;
  color_analysis: ColorAnalysis | null;
  onboarded: boolean;
  updated_at: string | null;
}

export type ProfileUpdate = Partial<Pick<Profile, "gender" | "body_type" | "styles" | "occasions" | "favorite_stores" | "budget_min" | "budget_max">> & {
  sizes?: Record<string, string>;
};

export interface SavedItem {
  saved_at: string;
  product: Product;
}

export interface Insights {
  likes: number;
  passes: number;
  top_categories: string[];
  top_brands: string[];
  top_stores: string[];
  favorite_colors: Swatch[];
  typical_price: number | null;
}

export interface StoreInfo {
  name: string;
  tier: "fast" | "legacy";
  default: boolean;
}

export interface ChatReply {
  reply: string;
  products: Product[];
  source: "gemini" | "concierge";
}

export interface SearchParams {
  q?: string;
  stores?: string[];
  gender?: string | null;
  styles?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  userId?: string | null;
  excludeSeen?: boolean;
}
