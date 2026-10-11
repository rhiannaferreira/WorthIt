// All localStorage access lives in this file so it is easy to find and replace.
// Only the service layer (api.ts) should import from here.

const PREFIX = 'worthit.';

export const STORAGE_KEYS = {
  essentials: `${PREFIX}essentials.v1`,
  reorders: `${PREFIX}reorders.v1`,
  settings: `${PREFIX}settings.v1`,
  chat: `${PREFIX}chat.v1`,
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Reads and parses a value. Returns null if missing or unreadable. */
export function readJson<T>(key: StorageKey): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

/** Saves a value. Throws a friendly error if the browser blocks storage. */
export function writeJson<T>(key: StorageKey, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('Your browser blocked saving. Changes may not be kept after a refresh.');
  }
}

export function clearAll(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

/** Stable, unique IDs for new records. */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}
