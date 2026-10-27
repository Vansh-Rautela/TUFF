/** The anonymous TUFF profile id kept on this device. */
const KEY = "tuff.user";
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function storedUserId(): string | null {
  try {
    const id = localStorage.getItem(KEY);
    return id && ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function storeUserId(id: string | null): void {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked (private mode): the session still works until reload.
  }
}
