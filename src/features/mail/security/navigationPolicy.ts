/**
 * The mail WebView loads exactly one thing: the sanitized document we hand it,
 * with baseUrl "about:blank". Every other navigation is refused inside the
 * WebView; http(s)/mailto links are offered to the system browser/mail app, but
 * only after the reader confirms (see SafeEmailView).
 */
export const EMAIL_BASE_URL = "about:blank";

export type NavigationDecision =
  { action: "allow" } | { action: "block" } | { action: "confirm-external"; url: string; host: string };

const EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function decideNavigation(url: string): NavigationDecision {
  // The initial load of our own document, and in-page #anchor jumps within it.
  if (url === EMAIL_BASE_URL || url.startsWith(`${EMAIL_BASE_URL}#`)) return { action: "allow" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { action: "block" };
  }
  if (!EXTERNAL_PROTOCOLS.has(parsed.protocol)) return { action: "block" };

  const host = parsed.protocol === "mailto:" ? parsed.pathname : parsed.hostname;
  return { action: "confirm-external", url: parsed.href, host };
}
