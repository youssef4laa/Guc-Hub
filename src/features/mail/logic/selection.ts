import type { MailSummary } from "../schema";

/** Pure selection maths, so the list's bulk-action rules are testable on their own. */

export function toggleSelected(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id];
}

/** Keeps only ids still present in the list — a refresh can remove a selected message. */
export function pruneSelection(selected: readonly string[], messages: MailSummary[]): string[] {
  const present = new Set(messages.map((message) => message.id));
  return selected.filter((id) => present.has(id));
}

export function isAllSelected(selected: readonly string[], messages: MailSummary[]): boolean {
  return messages.length > 0 && messages.every((message) => selected.includes(message.id));
}

/**
 * Which way a "mark read/unread" button should act on the current selection:
 * if anything unread is selected, the useful action is to mark read.
 */
export function bulkReadAction(selected: readonly string[], messages: MailSummary[]): "read" | "unread" {
  const chosen = messages.filter((message) => selected.includes(message.id));
  return chosen.some((message) => !message.isRead) ? "read" : "unread";
}
