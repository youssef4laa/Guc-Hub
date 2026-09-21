import Constants from "expo-constants";

import { featureHosts } from "./hosts.generated";

/**
 * Every host the app is allowed to talk to. The list itself comes from each
 * feature's own `hosts.ts` (aggregated by tools/gen-registry.js into
 * `hosts.generated.ts`) — this file never lists a literal hostname, so adding
 * one never means editing this shared file.
 * `EXPO_PUBLIC_HTTP_DEV_ALLOWLIST` (comma-separated) adds hosts for local testing
 * against a proxy/fixture server and is read only in dev builds.
 */
function readAllowlist(): string[] {
  const base = [...new Set(featureHosts)];

  const devAllowlist: string | undefined = process.env.EXPO_PUBLIC_HTTP_DEV_ALLOWLIST;
  if (__DEV__ && devAllowlist) {
    base.push(...devAllowlist.split(",").map((host: string) => host.trim()));
  }

  return base;
}

export const HTTP_ALLOWLIST = readAllowlist();

export const HTTP_CONFIG = {
  /** Max concurrent in-flight requests per host — be a polite client. */
  perHostConcurrency: 4,
  /** Minimum gap between requests to the same host. */
  minRequestIntervalMs: 150,
  maxRetries: 2,
  retryBaseDelayMs: 500,
  /** Short-TTL cache for GETs; parsed features layer their own longer cache on top via TanStack Query. */
  cacheTtlMs: 30_000,
};

export function appVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}
