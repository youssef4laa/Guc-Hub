import * as SecureStore from "expo-secure-store";

import type { PortalCredentials } from "../portal/LoginStrategy";

/**
 * The ONLY place GUC credentials are read or written. Backed by the iOS Keychain /
 * Android Keystore via expo-secure-store — never AsyncStorage, SQLite, or a log line.
 */
const CREDENTIALS_KEY = "guc-hub.portal-credentials";

export async function saveCredentials(credentials: PortalCredentials): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function loadCredentials(): Promise<PortalCredentials | null> {
  const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as PortalCredentials;
}

export async function deleteCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}

export async function hasStoredCredentials(): Promise<boolean> {
  return (await SecureStore.getItemAsync(CREDENTIALS_KEY)) !== null;
}
