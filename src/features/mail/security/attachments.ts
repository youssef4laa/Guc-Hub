/**
 * Attachments are untrusted, exactly like message bodies. A filename comes from
 * the sender, is used to name a file on disk, and is shown to the reader — so it
 * can try to escape a directory, hide itself, or disguise what it is.
 *
 * Nothing here ever opens anything: the app writes the file into its own cache
 * and hands it to the OS share sheet, and only after the reader confirms. We
 * never execute, auto-open, or render an attachment ourselves.
 */

/** Refuse anything larger; a mail attachment above this isn't worth the memory. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const FALLBACK_NAME = "attachment";
const MAX_FILENAME_LENGTH = 120;

const SLASH = 0x2f;
const BACKSLASH = 0x5c;
const DEL = 0x7f;
const LAST_C0_CONTROL = 0x1f;
// Bidi embeddings/overrides and isolates: these let a filename that is really
// "invoice_txt.exe" render to the reader as "invoice_exe.txt".
const BIDI_OVERRIDE_START = 0x202a;
const BIDI_OVERRIDE_END = 0x202e;
const BIDI_ISOLATE_START = 0x2066;
const BIDI_ISOLATE_END = 0x2069;

/** Checked by code point rather than by regex, so the source stays free of literal control characters. */
function isUnsafeCharacter(codePoint: number): boolean {
  return (
    codePoint <= LAST_C0_CONTROL ||
    codePoint === DEL ||
    codePoint === SLASH ||
    codePoint === BACKSLASH ||
    (codePoint >= BIDI_OVERRIDE_START && codePoint <= BIDI_OVERRIDE_END) ||
    (codePoint >= BIDI_ISOLATE_START && codePoint <= BIDI_ISOLATE_END)
  );
}

function stripUnsafeCharacters(raw: string): string {
  return [...raw].filter((character) => !isUnsafeCharacter(character.codePointAt(0) ?? 0)).join("");
}

/**
 * Extensions the OS may execute, or that carry scripts. The claimed MIME type is
 * not consulted for this — a sender picks it freely.
 */
const EXECUTABLE_EXTENSIONS = new Set([
  "exe",
  "msi",
  "bat",
  "cmd",
  "com",
  "scr",
  "pif",
  "vbs",
  "vbe",
  "js",
  "jse",
  "jar",
  "ps1",
  "sh",
  "bash",
  "command",
  "app",
  "dmg",
  "pkg",
  "apk",
  "deb",
  "rpm",
  "run",
  "bin",
  "reg",
  "lnk",
  "url",
  "hta",
  "cpl",
  "msc",
  "wsf",
  "iso",
]);

const PREVIEWABLE_TYPES: Record<string, "image" | "pdf" | "text"> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  heic: "image",
  pdf: "pdf",
  txt: "text",
  csv: "text",
  md: "text",
  log: "text",
};

export function fileExtension(filename: string): string {
  const match = /\.([a-z0-9]{1,12})$/i.exec(filename.trim());
  return match ? match[1].toLowerCase() : "";
}

/**
 * A filename safe to write into our own cache directory: no path separators, no
 * traversal, no hidden dot-file, no bidi trickery, bounded length.
 */
export function safeAttachmentFilename(raw: string): string {
  const withoutUnsafe = stripUnsafeCharacters(raw ?? "");
  // With separators gone, a leading dot can only hide the file, never traverse.
  const collapsed = withoutUnsafe
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+/, "")
    .trim();
  if (collapsed.length === 0) return FALLBACK_NAME;
  if (collapsed.length <= MAX_FILENAME_LENGTH) return collapsed;

  const extension = fileExtension(collapsed);
  const suffix = extension ? `.${extension}` : "";
  return collapsed.slice(0, MAX_FILENAME_LENGTH - suffix.length) + suffix;
}

export interface AttachmentClassification {
  extension: string;
  /** The OS might run this. Warn before handing it over, whatever the MIME type claims. */
  isExecutable: boolean;
  previewKind: "image" | "pdf" | "text" | "other";
  /** e.g. "report.pdf.exe" — a classic disguise worth showing the reader. */
  hasDoubleExtension: boolean;
}

export function classifyAttachment(filename: string): AttachmentClassification {
  const safe = safeAttachmentFilename(filename);
  const extension = fileExtension(safe);
  const middleParts = safe.toLowerCase().split(".").slice(1, -1);

  return {
    extension,
    isExecutable: EXECUTABLE_EXTENSIONS.has(extension),
    previewKind: PREVIEWABLE_TYPES[extension] ?? "other",
    hasDoubleExtension: middleParts.some(
      (part) => PREVIEWABLE_TYPES[part] !== undefined || EXECUTABLE_EXTENSIONS.has(part),
    ),
  };
}

/** True when the attachment is small enough to pull into memory and cache. */
export function isWithinSizeLimit(sizeBytes: number): boolean {
  return Number.isFinite(sizeBytes) && sizeBytes >= 0 && sizeBytes <= MAX_ATTACHMENT_BYTES;
}
