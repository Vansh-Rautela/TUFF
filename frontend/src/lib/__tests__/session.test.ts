import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, USER_ID_PATTERN, clearProfile, getOrCreateUserId, getUserId, hasStored, readJSON, writeJSON } from "../session";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});

describe("user id", () => {
  it("creates a random id the backend accepts and reuses it", () => {
    const id = getOrCreateUserId();
    expect(id).toMatch(USER_ID_PATTERN);
    expect(id).toMatch(/^user_[0-9a-f]{32}$/);
    expect(getOrCreateUserId()).toBe(id);
    expect(getUserId()).toBe(id);
  });

  it("keeps existing timestamp ids from older versions", () => {
    localStorage.setItem(STORAGE_KEYS.userId, "user_1717171717171");
    expect(getOrCreateUserId()).toBe("user_1717171717171");
  });

  it("replaces ids the backend would reject", () => {
    localStorage.setItem(STORAGE_KEYS.userId, "../../etc");
    expect(getUserId()).toBeNull();
    expect(getOrCreateUserId()).not.toBe("../../etc");
  });

  it("does not crash when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    });
    expect(getOrCreateUserId()).toMatch(USER_ID_PATTERN);
  });
});

describe("profile storage", () => {
  it("round-trips JSON and tolerates corrupt values", () => {
    writeJSON("k", { a: 1 });
    expect(readJSON("k")).toEqual({ a: 1 });
    localStorage.setItem("bad", "{not json");
    expect(readJSON("bad")).toBeNull();
  });

  it("distinguishes a stored null (skipped step) from never stored", () => {
    expect(hasStored(STORAGE_KEYS.colorAnalysis)).toBe(false);
    writeJSON(STORAGE_KEYS.colorAnalysis, null);
    expect(hasStored(STORAGE_KEYS.colorAnalysis)).toBe(true);
    expect(readJSON(STORAGE_KEYS.colorAnalysis)).toBeNull();
  });

  it("clears every profile key", () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.setItem(key, "x"));
    clearProfile();
    Object.values(STORAGE_KEYS).forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  });
});
