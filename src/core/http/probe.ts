import { fetch as nativeFetch } from "expo/fetch";

import { DisallowedHostError } from "./client";
import { HTTP_ALLOWLIST } from "./config";

/**
 * Dev-only diagnostics for DISCOVERY Spike 1 (see docs/discovery/spike-1-portal-auth.md).
 * Deliberately NOT gucFetch: it needs the raw status, each redirect hop, and header
 * names, which gucFetch hides (and turns a 401 into a SESSION_EXPIRED error). It still
 * enforces the host allowlist on every hop, sends no credentials, and never returns
 * a header or cookie VALUE — only names/schemes — so the output is safe to paste.
 */

export interface ProbeHop {
  status: number;
  host: string;
  path: string;
  /** Location target as host + path only (no query string), when the hop redirects. */
  redirectTo?: string;
  authSchemes: string[];
  cookieNames: string[];
  headerNames: string[];
}

export interface ProbeResult {
  hops: ProbeHop[];
  stoppedBecause: "final-response" | "max-redirects" | "redirect-off-allowlist" | "network-error";
  error?: string;
}

const MAX_HOPS = 8;

/** "NTLM, Negotiate, Basic realm=\"x\"" -> ["NTLM","Negotiate","Basic"]. Never returns tokens/realms. */
export function parseAuthSchemes(headerValue: string | null): string[] {
  if (!headerValue) return [];
  const schemes = new Set<string>();
  for (const part of headerValue.split(",")) {
    const piece = part.trim();
    if (/^[A-Za-z][A-Za-z0-9_-]*\s*=/.test(piece)) continue; // auth-param like realm="x", not a scheme
    const match = piece.match(/^([A-Za-z][A-Za-z0-9_-]*)(?:\s|$)/);
    if (match?.[1]) schemes.add(match[1]);
  }
  return [...schemes];
}

/** Extracts cookie NAMES only from a (possibly comma-merged) Set-Cookie value. */
export function parseCookieNames(headerValue: string | null): string[] {
  if (!headerValue) return [];
  const names = new Set<string>();
  for (const match of headerValue.matchAll(/(?:^|,\s*)([^=;,\s]+)=/g)) {
    const name = match[1];
    if (name && !/^(expires|path|domain|max-age|samesite)$/i.test(name)) names.add(name);
  }
  return [...names];
}

function hostAndPath(url: URL): string {
  return `${url.host}${url.pathname}`;
}

function assertAllowed(url: URL): void {
  if (!HTTP_ALLOWLIST.includes(url.hostname)) throw new DisallowedHostError(url.hostname);
}

export async function probeUrl(startUrl: string): Promise<ProbeResult> {
  const hops: ProbeHop[] = [];
  let current = new URL(startUrl);
  assertAllowed(current);

  for (let i = 0; i < MAX_HOPS; i++) {
    let response: Awaited<ReturnType<typeof nativeFetch>>;
    try {
      response = await nativeFetch(current.toString(), { redirect: "manual", method: "GET" });
    } catch (error) {
      return {
        hops,
        stoppedBecause: "network-error",
        error: error instanceof Error ? error.message : String(error),
      };
    }

    const location = response.headers.get("location");
    const hop: ProbeHop = {
      status: response.status,
      host: current.host,
      path: current.pathname,
      authSchemes: parseAuthSchemes(response.headers.get("www-authenticate")),
      cookieNames: parseCookieNames(response.headers.get("set-cookie")),
      headerNames: [...response.headers.keys()].sort(),
    };

    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, current);
      hop.redirectTo = hostAndPath(next);
      hops.push(hop);
      if (!HTTP_ALLOWLIST.includes(next.hostname)) {
        return { hops, stoppedBecause: "redirect-off-allowlist" };
      }
      current = next;
      continue;
    }

    hops.push(hop);
    return { hops, stoppedBecause: "final-response" };
  }

  return { hops, stoppedBecause: "max-redirects" };
}
