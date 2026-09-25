import type { MailSort, MailSummary } from "../schema";

export function senderLabel(summary: Pick<MailSummary, "from">): string {
  return summary.from.name?.trim() || summary.from.address;
}

const byDateDesc = (a: MailSummary, b: MailSummary) => Date.parse(b.date) - Date.parse(a.date);

/** Newest first is the tie-breaker for every order, so the list never jitters between refreshes. */
export function compareMessages(sort: MailSort): (a: MailSummary, b: MailSummary) => number {
  switch (sort) {
    case "oldest":
      return (a, b) => -byDateDesc(a, b);
    case "sender":
      return (a, b) =>
        senderLabel(a).localeCompare(senderLabel(b), "en", { sensitivity: "base" }) || byDateDesc(a, b);
    case "unread":
      return (a, b) => Number(a.isRead) - Number(b.isRead) || byDateDesc(a, b);
    case "newest":
    default:
      return byDateDesc;
  }
}

export function sortMessages<T extends MailSummary>(messages: T[], sort: MailSort): T[] {
  return [...messages].sort(compareMessages(sort));
}
