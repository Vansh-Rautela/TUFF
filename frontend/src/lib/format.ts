const rupee = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatPrice = (value: number | null | undefined): string | null => (value == null ? null : rupee.format(value));

export const titleCase = (value: string): string =>
  value.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bT-shirt\b/i, "T-Shirt");

/** "Warm Autumn" -> "warm-autumn" (for anchors and keys). */
export const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
