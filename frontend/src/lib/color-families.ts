/** Representative swatches for the colour families the swipe deck learns (backend adaptive_deck.py). */
export const COLOR_FAMILIES: Record<string, { label: string; hex: string }> = {
  "neutral-dark": { label: "Dark neutrals", hex: "#2B2A28" },
  "neutral-light": { label: "Light neutrals", hex: "#EDE8DF" },
  earth: { label: "Earth tones", hex: "#B8A58A" },
  yellow: { label: "Golds & mustards", hex: "#D4A017" },
  orange: { label: "Oranges & peach", hex: "#E9895A" },
  red: { label: "Reds & rust", hex: "#B7410E" },
  pink: { label: "Pinks & wine", hex: "#C9608A" },
  purple: { label: "Purples", hex: "#7A4A8C" },
  blue: { label: "Blues", hex: "#2F5597" },
  teal: { label: "Teals", hex: "#137C7C" },
  green: { label: "Greens", hex: "#2E8B57" },
  olive: { label: "Olives & sage", hex: "#6B6B2E" },
};
