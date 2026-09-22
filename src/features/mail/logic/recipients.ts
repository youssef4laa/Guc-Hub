import type { MailAddress } from "../schema";

/**
 * Parsing what someone typed into a To/Cc field. Deliberately forgiving about
 * separators and "Name <address>" forms, and deliberately strict about what
 * counts as an address: silently dropping a malformed recipient would mean a
 * message that never arrives, with no explanation.
 */

// Pragmatic, not RFC 5322: one @, no spaces, a dot in the domain. Anything this
// rejects is worth showing the student rather than sending into the void.
const ADDRESS_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function isValidAddress(address: string): boolean {
  return ADDRESS_PATTERN.test(address.trim());
}

export interface ParsedRecipients {
  addresses: MailAddress[];
  /** The raw text of anything that didn't look like an address. */
  invalid: string[];
}

/** Splits on commas and semicolons only — a display name may contain spaces. */
export function parseRecipients(raw: string): ParsedRecipients {
  const addresses: MailAddress[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const part of raw.split(/[,;]/)) {
    const entry = part.trim();
    if (entry.length === 0) continue;

    const angled = /^(.*?)\s*<([^>]+)>$/.exec(entry);
    const name = angled?.[1]?.trim().replace(/^"|"$/g, "");
    const address = (angled?.[2] ?? entry).trim();

    if (!isValidAddress(address)) {
      invalid.push(entry);
      continue;
    }
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    addresses.push(name ? { name, address } : { address });
  }

  return { addresses, invalid };
}

/** The inverse, for showing a stored draft back in the field the student typed into. */
export function formatRecipients(addresses: MailAddress[]): string {
  return addresses
    .map((recipient) => (recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address))
    .join(", ");
}
