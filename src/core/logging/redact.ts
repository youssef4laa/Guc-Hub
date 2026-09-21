/**
 * Patterns that must never reach a log line: GUC passwords, session cookies,
 * bearer tokens, and anything that looks like a captured credential string.
 * Add a pattern here rather than special-casing a call site.
 */
const SENSITIVE_KEYS = /password|passwd|secret|token|cookie|authorization|bearer/i;

const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
];

export function redactString(input: string): string {
  let out = input;
  for (const pattern of SENSITIVE_VALUE_PATTERNS) {
    out = out.replace(pattern, (match) => `${match.slice(0, 8)}[REDACTED]`);
  }
  return out;
}

export function redactValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, seen));
  if (value && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = SENSITIVE_KEYS.test(key) ? "[REDACTED]" : redactValue(val, seen);
    }
    return out;
  }
  return value;
}
