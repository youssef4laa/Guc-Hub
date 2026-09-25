import { DisallowedHostError } from "../../http/client";
import { HTTP_ALLOWLIST, HTTP_CONFIG } from "../../http/config";
import { getHostQueue } from "../../http/HostQueue";
import { loadCredentials } from "../../storage/secureStore";
import type { PortalCredentials } from "../LoginStrategy";
import { PortalError } from "../PortalError";
import {
  confirmStoredCredential,
  currentNtlmLoginGeneration,
  isNtlmCircuitTripped,
  isStoredCredentialConfirmed,
  tripNtlmCircuitBreaker,
} from "./ntlmCircuitBreaker";
import { getNativeNtlm } from "./nativeBinding";

export interface NtlmRequest {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  /** Text only in v1 (EWS SOAP XML; attachments are base64 inside it). */
  body?: string;
  timeoutMs?: number;
}

export interface NtlmResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const MAX_REDIRECTS = 5;

function allowedUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new DisallowedHostError(`${url.protocol}//${url.hostname}`);
  if (!HTTP_ALLOWLIST.includes(url.hostname)) throw new DisallowedHostError(url.hostname);
  return url;
}

function requireNative() {
  const native = getNativeNtlm();
  if (!native) {
    throw new PortalError(
      "NOT_IMPLEMENTED",
      "This build doesn't include the NTLM transport yet (modules/guc-ntlm). Install a newer dev client.",
    );
  }
  return native;
}

function storedCredentialRejected(): PortalError {
  return new PortalError("AUTH_INVALID", "GUC rejected the stored username or password; sign in again.");
}

/**
 * The one NTLM transport for the app (ADR A-001), used by the portal and by
 * Track B's EWS mail provider. Reads the single stored credential itself, so no
 * caller ever handles the password. Nothing here logs request or credential data.
 *
 * - Every hop's host must be on the allowlist, https only.
 * - GET redirects are followed here (never natively), re-checked each hop.
 * - 401 after the handshake means the stored credential is wrong: AUTH_INVALID.
 * - Any other status is returned as-is; EWS SOAP faults arrive as 500 with a body.
 * - A rejected stored credential trips a circuit breaker (ntlmCircuitBreaker.ts):
 *   every further call using that stored credential fails fast with AUTH_INVALID,
 *   no network/native call, until a fresh sign-in succeeds — see
 *   docs/adr/A-001-portal-auth.md.
 */
export async function ntlmRequest(request: NtlmRequest): Promise<NtlmResponse> {
  allowedUrl(request.url);
  requireNative();
  // The stored credential is read inside the coordinated attempt, not before it: a
  // call that waited out someone else's attempt (or a sign-in) must read whatever is
  // stored when it actually runs, not a copy from before it started waiting.
  return runStoredCredentialAttempt(undefined, async () => {
    const credentials = await loadCredentials();
    if (!credentials) {
      throw new PortalError("SESSION_EXPIRED", "No stored GUC credentials; please sign in.");
    }
    return performNtlmRequest(credentials, request);
  });
}

/**
 * Same as ntlmRequest, but with an explicit credential. Used by NtlmLoginStrategy
 * for both a freshly typed sign-in candidate and a silent retry of an
 * already-stored credential (biometric unlock, PortalSession.withFreshSession).
 * Deliberately not exported from ./index, so features can't pass passwords around.
 *
 * `isStoredCredential` marks the latter case — the credential is the same one a
 * caller could have reached via ntlmRequest, so it goes through the same circuit
 * breaker. The exemption is about where the credential came from, not which
 * function got called: guarding a password the user just typed a moment ago would
 * defeat the point, but a silent retry of the stored one is exactly what the
 * breaker exists to bound.
 */
export async function ntlmRequestWithCredentials(
  credentials: PortalCredentials,
  request: NtlmRequest,
  options?: { isStoredCredential?: boolean },
): Promise<NtlmResponse> {
  if (!options?.isStoredCredential) {
    return performNtlmRequest(credentials, request);
  }
  // The caller already read this credential, so it's only as current as this
  // moment: stamp it now, before any waiting, so a sign-in during the wait makes
  // its outcome stale rather than letting an old password trip the breaker.
  return runStoredCredentialAttempt(currentNtlmLoginGeneration(), () =>
    performNtlmRequest(credentials, request),
  );
}

// A burst of calls at launch (schedule, grades, mail, background refresh, ...) all
// want the same stored credential before any of them has heard back from the
// server. Until that credential is confirmed this session, only one attempt runs at
// a time: the rest wait, and each time the running one settles they re-check. If it
// was rejected, the breaker is tripped and they all fail fast. If it failed for a
// reason that says nothing about the password (a timeout, a network error), the
// next waiter becomes the single attempt and the rest keep waiting. Once a
// credential is confirmed, calls run concurrently as normal.
let inFlightStoredAttempt: Promise<unknown> | null = null;

async function runStoredCredentialAttempt(
  entryStamp: number | undefined,
  run: () => Promise<NtlmResponse>,
): Promise<NtlmResponse> {
  if (isNtlmCircuitTripped()) {
    throw storedCredentialRejected();
  }
  while (!isStoredCredentialConfirmed() && inFlightStoredAttempt) {
    await inFlightStoredAttempt.catch(() => undefined);
    if (isNtlmCircuitTripped()) {
      throw storedCredentialRejected();
    }
  }

  // Nothing below may await before inFlightStoredAttempt is set, or two waiters
  // woken together could both get past the loop.
  const stamp = entryStamp ?? currentNtlmLoginGeneration();
  const attempt = run().then(
    (response) => {
      confirmStoredCredential(stamp);
      return response;
    },
    (error: unknown) => {
      if (error instanceof PortalError && error.code === "AUTH_INVALID") {
        tripNtlmCircuitBreaker(stamp);
      }
      throw error;
    },
  );
  inFlightStoredAttempt = attempt;
  const clear = () => {
    if (inFlightStoredAttempt === attempt) inFlightStoredAttempt = null;
  };
  attempt.then(clear, clear);
  return attempt;
}

async function performNtlmRequest(
  credentials: PortalCredentials,
  request: NtlmRequest,
): Promise<NtlmResponse> {
  let url = allowedUrl(request.url);
  const native = requireNative();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const queue = getHostQueue(
      url.hostname,
      HTTP_CONFIG.perHostConcurrency,
      HTTP_CONFIG.minRequestIntervalMs,
    );
    let response;
    try {
      response = await queue.run(() =>
        native.request({
          url: url.toString(),
          method: request.method,
          headers: request.headers ?? {},
          body: request.body ?? null,
          username: credentials.username,
          password: credentials.password,
          timeoutMs: request.timeoutMs ?? 30_000,
        }),
      );
    } catch (cause) {
      throw new PortalError("PORTAL_UNAVAILABLE", "Could not reach the server.", {
        sourceUrl: url.toString(),
        cause,
      });
    }

    if (response.status === 401) {
      throw new PortalError("AUTH_INVALID", "GUC rejected the stored username or password.", {
        sourceUrl: url.toString(),
      });
    }

    const isRedirect = response.status >= 300 && response.status < 400 && response.location;
    if (isRedirect && request.method === "GET") {
      url = allowedUrl(new URL(response.location!, url).toString());
      continue;
    }

    return { status: response.status, headers: response.headers, body: response.body };
  }

  throw new PortalError("PORTAL_UNAVAILABLE", "Too many redirects.", { sourceUrl: url.toString() });
}
