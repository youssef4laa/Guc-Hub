import Constants from "expo-constants";

/**
 * Every host the app is allowed to talk to. Production hosts come from env config;
 * `EXPO_PUBLIC_HTTP_DEV_ALLOWLIST` (comma-separated) adds hosts for local testing
 * against a proxy/fixture server and is read only in dev builds.
 */
function readAllowlist(): string[] {
  const base = [process.env.EXPO_PUBLIC_GUC_PORTAL_HOST, process.env.EXPO_PUBLIC_GUC_MAIL_HOST].filter(
    (host): host is string => Boolean(host),
  );

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
