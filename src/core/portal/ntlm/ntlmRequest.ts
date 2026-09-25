import { DisallowedHostError } from "../../http/client";
import { HTTP_ALLOWLIST, HTTP_CONFIG } from "../../http/config";
import { getHostQueue } from "../../http/HostQueue";
import { loadCredentials } from "../../storage/secureStore";
import type { PortalCredentials } from "../LoginStrategy";
import { PortalError } from "../PortalError";
import { isNtlmCircuitTripped, tripNtlmCircuitBreaker } from "./ntlmCircuitBreaker";
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
  if (isNtlmCircuitTripped()) {
    throw storedCredentialRejected();
  }
  const credentials = await loadCredentials();
  if (!credentials) {
    throw new PortalError("SESSION_EXPIRED", "No stored GUC credentials; please sign in.");
  }
  return ntlmRequestWithCredentials(credentials, request, { isStoredCredential: true });
}

// A burst of calls at launch (schedule, grades, mail, background refresh, ...) all
// read the same stored credential in the same tick, before any of them has heard
// back from the server. Without coalescing, each one would independently make its
// own real attempt against a bad credential. This tracks whichever stored-credential
// attempt is currently in flight so a burst produces at most one real attempt: the
// first caller runs it for real, everyone else waits for that outcome (ignoring what
// it was) and then decides, from the breaker's state alone, whether to run its own.
let inFlightStoredAttempt: Promise<unknown> | null = null;

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

  if (isNtlmCircuitTripped()) {
    throw storedCredentialRejected();
  }
  if (inFlightStoredAttempt) {
    await inFlightStoredAttempt.catch(() => undefined);
    if (isNtlmCircuitTripped()) {
      throw storedCredentialRejected();
    }
  }

  const attempt = performNtlmRequest(credentials, request).catch((error: unknown) => {
    if (error instanceof PortalError && error.code === "AUTH_INVALID") {
      tripNtlmCircuitBreaker();
    }
    throw error;
  });
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
