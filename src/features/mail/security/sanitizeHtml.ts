import { HTMLElement, parse } from "node-html-parser";

/**
 * Email HTML is untrusted. This strips everything that can run code, submit
 * data, navigate on its own, or phone home, before the result goes anywhere near
 * a WebView. It is one of three independent layers — the WebView also runs with
 * JavaScript disabled, and `emailDocument.ts` adds a Content-Security-Policy that
 * blocks remote loads even if something slips past this file.
 *
 * Remote content (images, CSS backgrounds, fonts) is blocked unless the reader
 * explicitly allows it for this message: remote images are how senders track
 * opens, IP addresses and read times.
 */

export interface SanitizeOptions {
  allowRemoteContent: boolean;
}

export interface SanitizedEmail {
  /** Head `<style>` blocks, already sanitized. */
  styles: string[];
  /** Body markup, already sanitized. */
  bodyHtml: string;
  /** How many remote resources were stripped (0 when `allowRemoteContent` is true). */
  blockedRemoteCount: number;
}

// Removed along with everything inside them.
const DROPPED_ELEMENTS = [
  "script",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "meta",
  "link",
  "base",
  "title",
  "svg",
  "math",
  "video",
  "audio",
  "source",
  "track",
  "canvas",
  "template",
  "portal",
  "dialog",
];

// Attributes that are never needed to display an email and can load or navigate.
const DROPPED_ATTRIBUTES = new Set([
  "srcset",
  "srcdoc",
  "formaction",
  "action",
  "ping",
  "poster",
  "lowsrc",
  "dynsrc",
  "longdesc",
  "cite",
  "usemap",
  "xlink:href",
  "http-equiv",
  "target",
  "contenteditable",
]);

const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];
const SAFE_DATA_IMAGE = /^data:image\/(png|gif|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i;

export function isRemoteUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("http:") || trimmed.startsWith("https:") || trimmed.startsWith("//");
}

function linkProtocol(value: string): string | null {
  const match = /^\s*([a-z][a-z0-9+.-]*):/i.exec(value);
  return match ? `${match[1].toLowerCase()}:` : null;
}

function isSafeHref(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return true;
  const protocol = linkProtocol(trimmed);
  return protocol !== null && SAFE_LINK_PROTOCOLS.includes(protocol);
}

/**
 * Sanitizes CSS from a `style` attribute or `<style>` block. Anything that can
 * execute (expression(), behaviors, bindings, javascript: URLs) is removed
 * outright; `url(...)` survives only for inline data images, or for remote URLs
 * when the reader allowed remote content.
 */
export function sanitizeCss(css: string, options: SanitizeOptions): { css: string; blocked: number } {
  let blocked = 0;
  let out = css
    // Comments can hide tokens from the patterns below ("ur/**/l(").
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // CSS escapes can spell "url" or "expression" too — refuse to interpret them.
    .replace(/\\[0-9a-f]{1,6}\s?|\\./gi, "")
    .replace(/@import[^;]*;?/gi, () => {
      blocked += 1;
      return "";
    })
    .replace(/expression\s*\(/gi, "invalid(")
    .replace(/(-moz-binding|behavior)\s*:[^;}]*/gi, "")
    .replace(/url\s*\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (match, _quote: string, url: string) => {
      if (SAFE_DATA_IMAGE.test(url.trim())) return match;
      if (isRemoteUrl(url) && options.allowRemoteContent) return match;
      if (isRemoteUrl(url)) blocked += 1;
      return "none";
    });
  // Anything url-like left over (unbalanced parens, odd quoting) is dropped rather than parsed.
  out = out.replace(/url\s*\(/gi, "invalid(").replace(/javascript\s*:/gi, "");
  // Belt and braces: a remote address surviving in any other shape (an escape that
  // spelled "url", a property we don't know) never reaches the renderer at all.
  if (!options.allowRemoteContent) {
    out = out.replace(/(?:https?:)?\/\/[^\s'")]+/gi, () => {
      blocked += 1;
      return "blocked:";
    });
  }
  // `<` can't legitimately appear in email CSS, and would let text escape a <style> block.
  out = out.replace(/</g, "");
  return { css: out, blocked };
}

function sanitizeElement(el: HTMLElement, options: SanitizeOptions): number {
  let blocked = 0;
  const tag = el.tagName?.toLowerCase();

  for (const [rawName, value] of Object.entries(el.attributes)) {
    const name = rawName.toLowerCase();

    if (name.startsWith("on") || DROPPED_ATTRIBUTES.has(name)) {
      el.removeAttribute(rawName);
    } else if (name === "href") {
      if (!isSafeHref(value)) el.removeAttribute(rawName);
    } else if (name === "src" || name === "background") {
      if (SAFE_DATA_IMAGE.test(value.trim())) continue;
      if (isRemoteUrl(value) && options.allowRemoteContent) continue;
      if (isRemoteUrl(value)) blocked += 1;
      el.removeAttribute(rawName);
    } else if (name === "style") {
      const result = sanitizeCss(value, options);
      blocked += result.blocked;
      el.setAttribute(rawName, result.css);
    }
  }

  if ((tag === "a" || tag === "area") && el.hasAttribute("href")) {
    el.setAttribute("rel", "noopener noreferrer");
  }
  return blocked;
}

/**
 * Never throws: malformed markup that the parser can't handle comes back as an
 * empty body rather than as raw, unsanitized HTML.
 */
export function sanitizeEmailHtml(html: string, options: SanitizeOptions): SanitizedEmail {
  try {
    return sanitizeOrThrow(html, options);
  } catch {
    return { styles: [], bodyHtml: "", blockedRemoteCount: 0 };
  }
}

function sanitizeOrThrow(html: string, options: SanitizeOptions): SanitizedEmail {
  const root = parse(html, {
    comment: false,
    lowerCaseTagName: true,
    // Only script/style keep raw text. Everything else (notably <noscript>, which
    // renders when JS is off) is parsed into elements, so it gets sanitized too.
    blockTextElements: { script: true, style: true },
  });

  for (const node of root.querySelectorAll(DROPPED_ELEMENTS.join(","))) node.remove();

  let blocked = 0;
  const styles: string[] = [];
  for (const styleEl of root.querySelectorAll("style")) {
    const result = sanitizeCss(styleEl.textContent, options);
    blocked += result.blocked;
    styles.push(result.css);
    styleEl.remove();
  }

  for (const el of root.querySelectorAll("*")) blocked += sanitizeElement(el, options);

  const body = root.querySelector("body");
  const bodyHtml = body ? wrapBodyAttributes(body) : root.innerHTML;

  return { styles, bodyHtml, blockedRemoteCount: blocked };
}

/** Keeps the sender's body-level styling (bgcolor, style) by moving it onto a wrapper div. */
function wrapBodyAttributes(body: HTMLElement): string {
  const wrapper = new HTMLElement("div", {}, "");
  const style = body.getAttribute("style");
  const bgcolor = body.getAttribute("bgcolor")?.trim();
  // Only a bare colour token — anything else could smuggle url(...) past sanitizeCss.
  const safeBgcolor = bgcolor && /^#?[a-z0-9]{1,20}$/i.test(bgcolor) ? bgcolor : null;
  const combined = [safeBgcolor ? `background-color: ${safeBgcolor}` : "", style ?? ""]
    .filter(Boolean)
    .join("; ");
  if (combined) wrapper.setAttribute("style", combined);
  wrapper.set_content(body.childNodes);
  return wrapper.toString();
}
