import { getItem, setItem } from "../storage/kv";

/**
 * "Try demo" (login screen) and `EXPO_PUBLIC_MODE=mock` both land here. This is also
 * how store reviewers run the whole app without GUC credentials, and the default
 * day-to-day dev mode. Every feature's `source.ts` reads this to pick mock vs live.
 */
const KEY = "demo-mode";
let cached: boolean | null = null;

export async function isDemoMode(): Promise<boolean> {
  if (cached !== null) return cached;
  const stored = await getItem<boolean>(KEY);
  cached = stored ?? process.env.EXPO_PUBLIC_MODE === "mock";
  return cached;
}

export async function setDemoMode(value: boolean): Promise<void> {
  cached = value;
  await setItem(KEY, value);
}

/** Synchronous best-effort read for render-time checks; call isDemoMode() first to warm it. */
export function isDemoModeSync(): boolean {
  return cached ?? process.env.EXPO_PUBLIC_MODE === "mock";
}
