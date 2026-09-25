import { sanitizeEmailHtml, type SanitizeOptions } from "./sanitizeHtml";

export interface EmailDocument {
  /** A complete HTML document, safe to hand to the mail WebView. */
  html: string;
  blockedRemoteCount: number;
}

/**
 * Defense in depth on top of sanitizeHtml.ts: even if a remote reference slipped
 * through, the WebView refuses to load it. `default-src 'none'` also forbids
 * scripts, frames, fonts and media outright. Remote images are only permitted
 * once the reader taps "Load images" for this message.
 */
export function contentSecurityPolicy({ allowRemoteContent }: SanitizeOptions): string {
  return [
    "default-src 'none'",
    `img-src data:${allowRemoteContent ? " https: http:" : ""}`,
    `style-src 'unsafe-inline'`,
    "font-src data:",
    "form-action 'none'",
    "base-uri 'none'",
  ].join("; ");
}

// Emails are designed for a light background, so the body renders on white in
// both themes (like most mail clients) — the app chrome around it follows the theme.
const BASE_STYLES = `
  html { -webkit-text-size-adjust: 100%; color-scheme: light; }
  body { margin: 0; padding: 16px; background: #ffffff; color: #111318;
         font-family: -apple-system, system-ui, Roboto, "Helvetica Neue", Arial, sans-serif;
         font-size: 16px; line-height: 1.45; overflow-wrap: anywhere; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  pre { white-space: pre-wrap; }
  a { color: #0B5FFF; }
`;

export function buildEmailDocument(rawHtml: string, options: SanitizeOptions): EmailDocument {
  const { styles, bodyHtml, blockedRemoteCount } = sanitizeEmailHtml(rawHtml, options);
  const senderStyles = styles.map((css) => `<style>${css}</style>`).join("");

  const html =
    "<!DOCTYPE html><html><head>" +
    '<meta charset="utf-8">' +
    `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(options)}">` +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="referrer" content="no-referrer">' +
    `<style>${BASE_STYLES}</style>` +
    senderStyles +
    `</head><body>${bodyHtml}</body></html>`;

  return { html, blockedRemoteCount };
}
