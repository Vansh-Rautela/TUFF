import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatPrice, slug, titleCase } from "../format";
import { PhotoError, fitWithin, validatePhoto } from "../image";
import { storeUserId, storedUserId } from "../session";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}

describe("session", () => {
  beforeEach(() => vi.stubGlobal("localStorage", new MemoryStorage()));

  it("stores and forgets the profile id", () => {
    expect(storedUserId()).toBeNull();
    storeUserId("u_abc");
    expect(storedUserId()).toBe("u_abc");
    storeUserId(null);
    expect(storedUserId()).toBeNull();
  });

  it("ignores ids the API would reject", () => {
    localStorage.setItem("tuff.user", "../etc");
    expect(storedUserId()).toBeNull();
  });

  it("survives blocked storage", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
    expect(storedUserId()).toBeNull();
    expect(() => storeUserId("u_1")).not.toThrow();
  });
});

describe("image", () => {
  it("fits within the upload size keeping aspect ratio", () => {
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it("validates type and size", () => {
    expect(() => validatePhoto(new File(["x"], "a.gif", { type: "image/gif" }))).toThrow(PhotoError);
    expect(() => validatePhoto(new File([new Uint8Array(16 * 1024 * 1024)], "a.jpg", { type: "image/jpeg" }))).toThrow(/15 MB/);
    expect(() => validatePhoto(new File(["x"], "a.jpg", { type: "image/jpeg" }))).not.toThrow();
  });
});

describe("format", () => {
  it("formats rupees and text", () => {
    expect(formatPrice(1299)).toBe("₹1,299");
    expect(formatPrice(null)).toBeNull();
    expect(titleCase("t-shirt dress")).toBe("T-Shirt Dress");
    expect(slug("Warm Autumn!")).toBe("warm-autumn");
  });
});
