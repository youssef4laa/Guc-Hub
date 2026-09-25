import { parse } from "node-html-parser";

import type { MailBody } from "../schema";

const NON_CONTENT_TAGS = "head, style, script, title, noscript, template";

/** Readable text from an email body, for snippets and search — never for rendering. */
export function bodyToPlainText(body: MailBody): string {
  if (body.kind === "text") return collapseWhitespace(body.text);
  try {
    const root = parse(body.html, { comment: false, blockTextElements: { script: true, style: true } });
    for (const node of root.querySelectorAll(NON_CONTENT_TAGS)) node.remove();
    return collapseWhitespace(root.textContent);
  } catch {
    return "";
  }
}

export function makeSnippet(body: MailBody, maxLength = 140): string {
  const text = bodyToPlainText(body);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function collapseWhitespace(text: string): string {
  return decodeBasicEntities(text).replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}
