import { afterEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL, ApiError, api, errorMessage, searchQueryString, streamSearch } from "../api";

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

afterEach(() => vi.unstubAllGlobals());

describe("searchQueryString", () => {
  it("encodes repeatable and optional params", () => {
    const qs = searchQueryString({ q: "olive kurta", stores: ["Myntra", "Amazon"], styles: ["casual"], maxPrice: 2000, userId: "u_1", excludeSeen: true });
    expect(qs).toBe("q=olive+kurta&store=Myntra&store=Amazon&style=casual&max_price=2000&user_id=u_1&exclude_seen=true");
    expect(searchQueryString({})).toBe("");
  });
});

describe("request", () => {
  it("targets the versioned API and parses JSON", async () => {
    const fetchMock = vi.fn(() => json({ id: "u_1" }, 201));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.createUser()).resolves.toEqual({ id: "u_1" });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/v1/users`, { method: "POST" });
  });

  it("returns undefined for 204", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json(null, 204)));
    await expect(api.unsave("u_1", "p")).resolves.toBeUndefined();
  });

  it("surfaces structured API errors", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json({ error: { code: "no_face", message: "No face found." } }, 422)));
    const error = (await api.analyzeFace(new Blob(["x"])).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect([error.status, error.code, errorMessage(error)]).toEqual([422, "no_face", "No face found."]);
  });

  it("reports network failures kindly", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(api.health()).rejects.toMatchObject({ status: 0, code: "network" });
    expect(errorMessage(new Error("x"), "fallback")).toBe("fallback");
  });

  it("sends photos as multipart with the user id", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => json({}));
    vi.stubGlobal("fetch", fetchMock);
    await api.analyzeFace(new Blob(["img"], { type: "image/jpeg" }), "u_9");
    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get("user_id")).toBe("u_9");
    expect(body.get("photo")).toBeInstanceOf(Blob);
  });
});

class FakeEventSource {
  static last: FakeEventSource;
  listeners: Record<string, (e: { data: string }) => void> = {};
  onerror: (() => void) | null = null;
  closed = false;
  constructor(readonly url: string) { FakeEventSource.last = this; }
  addEventListener(name: string, fn: (e: { data: string }) => void) { this.listeners[name] = fn; }
  emit(name: string, data: unknown) { this.listeners[name]({ data: JSON.stringify(data) }); }
  close() { this.closed = true; }
}

describe("streamSearch", () => {
  it("delivers store batches then closes on done", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const onStore = vi.fn();
    const onDone = vi.fn();
    streamSearch({ q: "kurta" }, { onStore, onDone });
    const source = FakeEventSource.last;
    expect(source.url).toContain("/products/search/stream?q=kurta");
    source.emit("store", { store: { store: "Myntra", count: 1 }, products: [{ id: "p1" }] });
    source.emit("done", { elapsed_ms: 1200 });
    expect(onStore).toHaveBeenCalledWith({ store: "Myntra", count: 1 }, [{ id: "p1" }]);
    expect(onDone).toHaveBeenCalledWith(1200);
    expect(source.closed).toBe(true);
  });

  it("reports a broken stream once and can be cancelled", () => {
    vi.stubGlobal("EventSource", FakeEventSource);
    const onError = vi.fn();
    const cancel = streamSearch({}, { onStore: vi.fn(), onError });
    FakeEventSource.last.onerror?.();
    expect(onError).toHaveBeenCalledOnce();
    cancel();
    expect(FakeEventSource.last.closed).toBe(true);
  });
});
