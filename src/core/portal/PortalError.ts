export type PortalErrorCode =
  | "AUTH_INVALID"
  | "SESSION_EXPIRED"
  | "PORTAL_UNAVAILABLE"
  | "PARSE_FAILED"
  | "TRANSCRIPT_LOCKED"
  | "NOT_IMPLEMENTED"
  | "OFFLINE";

export class PortalError extends Error {
  readonly code: PortalErrorCode;
  /** The original portal URL, when relevant, so the UI can offer "open original page". */
  readonly sourceUrl?: string;
  readonly cause?: unknown;

  constructor(code: PortalErrorCode, message: string, options?: { sourceUrl?: string; cause?: unknown }) {
    super(message);
    this.name = "PortalError";
    this.code = code;
    this.sourceUrl = options?.sourceUrl;
    this.cause = options?.cause;
  }
}

export function notImplemented(feature: string, sourceUrl?: string): never {
  throw new PortalError(
    "NOT_IMPLEMENTED",
    `${feature} live source needs a real fixture — see fixtures/${feature}/README.md`,
    { sourceUrl },
  );
}
