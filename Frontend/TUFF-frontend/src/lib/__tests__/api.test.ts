import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, ApiError, api, apiRequest, errorMessage, swipeToProduct } from "../api";

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("defaults to the local backend", () => {
    expect(API_BASE_URL).toBe("http://localhost:5000");
  });

  it("sends JSON and returns the parsed body", async () => {
    const fetchMock = mockFetch(() => json({ ok: true }));
    await expect(apiRequest("/x", { method: "POST", body: { a: 1 } })).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:5000/x");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"a":1}');
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("surfaces the server's error message and status", async () => {
    mockFetch(() => json({ error: "No face detected in the image." }, 422));
    const error = (await apiRequest("/analyze").catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(errorMessage(error)).toBe("No face detected in the image.");
  });

  it("keeps the body for callers that need extra fields", async () => {
    mockFetch(() => json({ error: "TUFFY is not configured", tuffy_says: "resting" }, 503));
    const error = (await apiRequest("/tuffy/chat").catch((e) => e)) as ApiError;
    expect((error.body as { tuffy_says: string }).tuffy_says).toBe("resting");
  });

  it("handles non-JSON error pages", async () => {
    mockFetch(() => Promise.resolve(new Response("<html>Bad gateway</html>", { status: 502 })));
    await expect(apiRequest("/x")).rejects.toMatchObject({ status: 502, message: "Request failed (502)" });
  });

  it("reports network failures with status 0", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(apiRequest("/x")).rejects.toMatchObject({ status: 0 });
  });

  it("rethrows aborts untouched", async () => {
    mockFetch(() => Promise.reject(new DOMException("aborted", "AbortError")));
    await expect(apiRequest("/x")).rejects.toMatchObject({ name: "AbortError" });
  });

  it("falls back for unknown errors", () => {
    expect(errorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });
});

describe("api helpers", () => {
  it("encodes user ids in paths", async () => {
    const fetchMock = mockFetch(() => json({ liked_products: [], count: 0 }));
    await api.likedProducts("user_1");
    await api.removeLiked("user 2", "https://x");
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      "http://localhost:5000/liked_products/user_1",
      "http://localhost:5000/liked_products/user%202/remove",
    ]);
  });

  it("sends only the search text as the prompt", async () => {
    const fetchMock = mockFetch(() => json({ products: [], query: "", errors: {} }));
    await api.searchProducts({ userId: "u", gender: "Female", brands: ["Myntra"], prompt: "olive kurta" });
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body).toEqual({
      userData: { userId: "u", gender: "Female", brands: ["Myntra"] },
      filters: {},
      prompt: "olive kurta",
    });
  });

  it("maps saved swipes to products", () => {
    expect(
      swipeToProduct({
        product_id: "id",
        product_title: "Olive Shirt",
        product_brand: "Myntra",
        product_image: "https://img",
        product_price: "₹999",
        product_link: "https://x",
        action: "like",
        timestamp: "t",
        product_features: { color: "olive" },
      }),
    ).toMatchObject({ title: "Olive Shirt", thumbnail: "https://img", link: "https://x", color: "olive" });
  });
});
