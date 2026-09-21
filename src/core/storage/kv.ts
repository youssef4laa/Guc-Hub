import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Small, non-sensitive key-value store (theme choice, "seen the unofficial-app
 * notice", query cache persistence). Never store credentials or portal data here —
 * that's what secureStore.ts and the per-feature SQLite tables are for.
 */
const PREFIX = "guc-hub.kv.";

export async function getItem<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(PREFIX + key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + key);
}
