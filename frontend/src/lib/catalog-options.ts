/** Choices offered during onboarding and in the profile editor. */

export const GENDERS = [
  { value: "women", label: "Womenswear" },
  { value: "men", label: "Menswear" },
  { value: "unisex", label: "Everything" },
] as const;

export const BODY_TYPES = ["Petite", "Slim", "Athletic", "Average", "Curvy", "Plus size", "Tall"];

export const STYLES = [
  "minimalist", "classic", "casual", "elegant", "streetwear", "ethnic", "bohemian", "athleisure", "vintage", "bold",
];

export const OCCASIONS = ["everyday", "work", "evening", "wedding", "festive", "travel", "date", "weekend"];

export const BUDGETS = [
  { label: "Considered", detail: "Up to ₹1,500", min: 0, max: 1500 },
  { label: "Elevated", detail: "₹1,500 – ₹4,000", min: 1500, max: 4000 },
  { label: "Luxe", detail: "₹4,000 – ₹12,000", min: 4000, max: 12000 },
  { label: "No limit", detail: "Show me everything", min: 0, max: 100000 },
];

export const SIZES = {
  tops: ["XS", "S", "M", "L", "XL", "XXL"],
  bottoms: ["26", "28", "30", "32", "34", "36", "38"],
  shoes: ["5", "6", "7", "8", "9", "10", "11"],
};

export const PRICE_FILTERS = [
  { label: "Any price", min: null, max: null },
  { label: "Under ₹1,000", min: null, max: 1000 },
  { label: "₹1,000 – ₹3,000", min: 1000, max: 3000 },
  { label: "₹3,000 +", min: 3000, max: null },
] as const;
