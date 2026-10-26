/** Shapes returned by the TUFF backend (see Backend/main.py). */

export interface Product {
  id?: string;
  title: string;
  link: string;
  thumbnail: string;
  price?: string | null;
  price_value?: number | null;
  brand?: string;
  color?: string | null;
  category?: string | null;
  gender?: string | null;
  style?: string;
  tags?: string[];
  /** 0-100, present on ranked results. */
  match_score?: number;
  match_reasons?: string[];
  /** Legacy alias of match_score. */
  recommendation_score?: number;
}

export interface PaletteColor {
  name: string;
  hex: string;
  color?: string;
}

export interface SeasonPalette {
  season: string;
  description: string;
  key_characteristics: string[];
  palettes: {
    primary: string[];
    neutrals: string[];
    accent: string[];
    jewelry_metals: string[];
  };
  color_names?: { primary: string[]; neutrals: string[]; accent: string[] };
  avoid?: string[];
  color_relationships: {
    tonal: string[];
    analogous: string[];
    complementary_contrast: string[];
  };
}

export interface Skintone {
  name: string;
  color: string;
  hex: string;
  undertone: string;
  brightness: string;
  season: string;
  contrast: string;
}

export interface ColorAnalysisResult {
  success?: boolean;
  skintone: Skintone;
  complementaryColors: PaletteColor[];
  description: string;
  palette?: SeasonPalette;
  method?: string;
  disclaimer?: string;
}

export interface SwipeRecord {
  product_id: string;
  product_title: string;
  product_brand: string;
  product_image: string;
  product_price: string | null;
  product_link: string;
  action: "like" | "dislike";
  timestamp: string;
  product_features: { color?: string; category?: string; style?: string; tags?: string[] };
}

export interface UserAnalysis {
  favorite_brands: string[];
  favorite_colors: string[];
  favorite_styles: string[];
  favorite_categories: string[];
  total_likes: number;
  total_dislikes: number;
  like_rate?: number;
}

export interface ClothingSizes {
  gender: string;
  physique: string;
  tops: string;
  bottoms: string;
  shoes: string;
  dresses?: string;
}

export interface StylePreferences {
  styles: string[];
  occasions: string[];
  budget: { min: number; max: number };
}

export interface ProfileUpdates {
  color_analysis?: ColorAnalysisResult | null;
  gender?: string;
  body_type?: string;
  clothing_sizes?: ClothingSizes;
  style_preferences?: string[];
  occasions?: string[];
  favorite_brands?: string[];
  budget_range?: { min: number; max: number };
}

export interface SearchFilters {
  brands?: string[];
  prices?: string[];
  styles?: string[];
}

/** Profile context sent to TUFFY. */
export interface TuffyUserData {
  colorAnalysis?: ColorAnalysisResult | null;
  gender?: string;
  physique?: string;
  favoriteStyles?: string[];
  currentProducts?: Product[];
}

/** Product shape used by TUFFY's chat cards and the local cart/wishlist. */
export interface MiniProduct {
  product_title: string;
  product_brand: string;
  product_price: string;
  product_image: string;
  product_link: string;
}
