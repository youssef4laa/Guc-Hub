import { DisallowedHostError } from "../../http/client";
import { HTTP_ALLOWLIST, HTTP_CONFIG } from "../../http/config";
import { getHostQueue } from "../../http/HostQueue";
import { loadCredentials } from "../../storage/secureStore";
import { PortalError } from "../PortalError";
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

/**
 * The one NTLM transport for the app (ADR A-001), used by the portal and by
 * Track B's EWS mail provider. Reads the single stored credential itself, so no
 * caller ever handles the password. Nothing here logs request or credential data.
 *
 * - Every hop's host must be on the allowlist, https only.
 * - GET redirects are followed here (never natively), re-checked each hop.
 * - 401 after the handshake means the stored credential is wrong: AUTH_INVALID.
 * - Any other status is returned as-is; EWS SOAP faults arrive as 500 with a body.
 */
export async function ntlmRequest(request: NtlmRequest): Promise<NtlmResponse> {
  let url = allowedUrl(request.url);

  const native = getNativeNtlm();
  if (!native) {
    throw new PortalError(
      "NOT_IMPLEMENTED",
      "This build doesn't include the NTLM transport yet (modules/guc-ntlm). Install a newer dev client.",
    );
  }

  const credentials = await loadCredentials();
  if (!credentials) {
    throw new PortalError("SESSION_EXPIRED", "No stored GUC credentials; please sign in.");
  }

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
