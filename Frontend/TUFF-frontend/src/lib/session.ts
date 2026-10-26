/**
 * Anonymous, device-local identity and profile cache.
 *
 * TUFF has no accounts yet: a random id in localStorage keys the user's
 * profile on the backend. Anyone who knows the id can read that profile, so
 * ids are random (not timestamps) and nothing sensitive is stored under them.
 */
import type { ClothingSizes, ColorAnalysisResult, StylePreferences } from "@/types/fashion";

export const STORAGE_KEYS = {
  userId: "userId",
  gender: "userGender",
  bodyType: "userBodyType",
  colorAnalysis: "colorAnalysis",
  sizes: "userSizes",
  preferences: "userPreferences",
  likedProducts: "likedProducts",
  searchedProducts: "searchedProducts",
} as const;

/** Must match Backend/validation.py USER_ID_PATTERN. */
export const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage disabled (private mode): the app still works for this visit.
  }
}

/** True if the key was ever written, even with the JSON value null. */
export function hasStored(key: string): boolean {
  return read(key) !== null;
}

export function readJSON<T>(key: string): T | null {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown) {
  write(key, JSON.stringify(value));
}

/** Existing id if valid, otherwise a new random one (persisted). */
export function getOrCreateUserId(): string {
  const existing = read(STORAGE_KEYS.userId);
  if (existing && USER_ID_PATTERN.test(existing)) return existing;
  const id = `user_${randomId().replace(/-/g, "")}`;
  write(STORAGE_KEYS.userId, id);
  return id;
}

export function getUserId(): string | null {
  const existing = read(STORAGE_KEYS.userId);
  return existing && USER_ID_PATTERN.test(existing) ? existing : null;
}

export function getSavedGender(): string | null {
  return read(STORAGE_KEYS.gender);
}

export function saveGenderAndBody(gender?: string, bodyType?: string) {
  if (gender) write(STORAGE_KEYS.gender, gender);
  if (bodyType) write(STORAGE_KEYS.bodyType, bodyType);
}

export function getSavedBodyType(): string | null {
  return read(STORAGE_KEYS.bodyType);
}

export const profileCache = {
  colorAnalysis: () => readJSON<ColorAnalysisResult>(STORAGE_KEYS.colorAnalysis),
  sizes: () => readJSON<ClothingSizes>(STORAGE_KEYS.sizes),
  preferences: () => readJSON<StylePreferences>(STORAGE_KEYS.preferences),
};

/** Forget everything stored on this device for the current profile. */
export function clearProfile() {
  Object.values(STORAGE_KEYS).forEach((key) => write(key, null));
}
