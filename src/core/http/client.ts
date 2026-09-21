import { createLogger } from "../logging";
import { PortalError } from "../portal/PortalError";
import { HTTP_ALLOWLIST, HTTP_CONFIG } from "./config";
import { getHostQueue } from "./HostQueue";

const log = createLogger("http");

export class DisallowedHostError extends Error {
  constructor(host: string) {
    super(`Refusing to request "${host}": not in the GUC host allowlist. Add it to config, not here.`);
    this.name = "DisallowedHostError";
  }
}

export interface GucRequestInit extends RequestInit {
  /** Skip the short-TTL GET cache for this call. */
  bypassCache?: boolean;
  timeoutMs?: number;
}

interface CacheEntry {
  expiresAt: number;
  body: string;
  status: number;
  headers: Record<string, string>;
}

const cache = new Map<string, CacheEntry>();

function assertAllowedHost(url: string): string {
  const { hostname } = new URL(url);
  if (!HTTP_ALLOWLIST.includes(hostname)) {
    throw new DisallowedHostError(hostname);
  }
  return hostname;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await promise;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The ONLY fetch wrapper allowed to reach the network in this app (enforced by the
 * `no-restricted-globals` rule on "fetch" in eslint.config.js, scoped everywhere
 * under src/ except this file). Validates the host against the allowlist, never disables TLS
 * verification, throttles per host, retries idempotent GETs with backoff, and
 * short-TTL-caches GET responses.
 */
export async function gucFetch(url: string, init: GucRequestInit = {}): Promise<Response> {
  const host = assertAllowedHost(url);
  const method = (init.method ?? "GET").toUpperCase();
  const cacheKey = `${method}:${url}`;

  if (method === "GET" && !init.bypassCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      log.debug("cache hit", { url });
      return new Response(cached.body, { status: cached.status, headers: cached.headers });
    }
  }

  const queue = getHostQueue(host, HTTP_CONFIG.perHostConcurrency, HTTP_CONFIG.minRequestIntervalMs);

  const attempt = async (retriesLeft: number): Promise<Response> => {
    try {
      const response = await queue.run(() => withTimeout(fetch(url, init), init.timeoutMs ?? 15_000));

      if (response.status === 401 || response.status === 419) {
        throw new PortalError("SESSION_EXPIRED", "Portal session expired.", { sourceUrl: url });
      }
      if (response.status >= 500 && retriesLeft > 0) {
        throw new Error(`Portal returned ${response.status}`);
      }
      if (!response.ok && response.status !== 401 && response.status !== 419) {
        throw new PortalError("PORTAL_UNAVAILABLE", `Portal returned ${response.status}.`, {
          sourceUrl: url,
        });
      }

      if (method === "GET") {
        const body = await response.clone().text();
        cache.set(cacheKey, {
          body,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          expiresAt: Date.now() + HTTP_CONFIG.cacheTtlMs,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof PortalError) throw error;
      if (retriesLeft <= 0) {
        throw new PortalError("PORTAL_UNAVAILABLE", "Could not reach the portal.", {
          sourceUrl: url,
          cause: error,
        });
      }
      const delay = HTTP_CONFIG.retryBaseDelayMs * 2 ** (HTTP_CONFIG.maxRetries - retriesLeft);
      log.warn("request failed, retrying", { url, delay });
      await sleep(delay);
      return attempt(retriesLeft - 1);
    }
  };

  return attempt(HTTP_CONFIG.maxRetries);
}
