import {
  createDraft,
  isDraftEmpty,
  MAX_TOTAL_ATTACHMENT_BYTES,
  totalAttachmentBytes,
  validateDraft,
} from "../logic/draft";
import { formatRecipients, isValidAddress, parseRecipients } from "../logic/recipients";
import type { MailDraft, OutgoingAttachment } from "../schema";

const NOW = new Date("2026-09-22T10:00:00+03:00");

function draft(overrides: Partial<MailDraft> = {}): MailDraft {
  return { ...createDraft("d1", NOW), ...overrides };
}

function attachment(sizeBytes: number, filename = "file.pdf"): OutgoingAttachment {
  return { filename, mimeType: "application/pdf", sizeBytes, uri: `file:///tmp/${filename}` };
}

describe("parseRecipients", () => {
  it("accepts a single address", () => {
    expect(parseRecipients("someone@example-guc.invalid").addresses).toEqual([
      { address: "someone@example-guc.invalid" },
    ]);
  });

  it("splits on commas and semicolons, but not on spaces inside a name", () => {
    const { addresses } = parseRecipients(
      "Dr. Sara Nabil <sara@example-guc.invalid>; omar@example-guc.invalid, nour@example-guc.invalid",
    );
    expect(addresses).toEqual([
      { name: "Dr. Sara Nabil", address: "sara@example-guc.invalid" },
      { address: "omar@example-guc.invalid" },
      { address: "nour@example-guc.invalid" },
    ]);
  });

  it("strips quotes around a display name", () => {
    expect(parseRecipients('"Sara Nabil" <sara@example-guc.invalid>').addresses[0].name).toBe("Sara Nabil");
  });

  it("reports malformed entries instead of dropping them silently", () => {
    const { addresses, invalid } = parseRecipients("good@example-guc.invalid, not-an-address, @nope");
    expect(addresses).toHaveLength(1);
    expect(invalid).toEqual(["not-an-address", "@nope"]);
  });

  it("treats a bare GUC username as invalid — it is a login, not an address", () => {
    expect(parseRecipients("mohamed.khalifa").invalid).toEqual(["mohamed.khalifa"]);
  });

  it("de-duplicates case-insensitively and ignores empty entries", () => {
    const { addresses } = parseRecipients("A@Example-Guc.invalid, , a@example-guc.invalid;");
    expect(addresses).toHaveLength(1);
  });

  it("round-trips through formatRecipients", () => {
    const text = "Sara Nabil <sara@example-guc.invalid>, omar@example-guc.invalid";
    expect(formatRecipients(parseRecipients(text).addresses)).toBe(text);
  });
});

describe("isValidAddress", () => {
  it("requires an @ and a dotted domain", () => {
    expect(isValidAddress("a@b.invalid")).toBe(true);
    expect(isValidAddress("a@b")).toBe(false);
    expect(isValidAddress("a b@c.invalid")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });
});

describe("isDraftEmpty", () => {
  it("is true for a new draft and false once anything is typed", () => {
    expect(isDraftEmpty(draft())).toBe(true);
    expect(isDraftEmpty(draft({ subject: "  " }))).toBe(true);
    expect(isDraftEmpty(draft({ text: "hello" }))).toBe(false);
    expect(isDraftEmpty(draft({ attachments: [attachment(10)] }))).toBe(false);
  });
});

describe("validateDraft", () => {
  it("builds an outgoing message from a valid draft", () => {
    const result = validateDraft(
      draft({
        to: "sara@example-guc.invalid",
        cc: "omar@example-guc.invalid",
        subject: "  Question  ",
        text: "Body",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.to).toEqual([{ address: "sara@example-guc.invalid" }]);
    expect(result.message.cc).toEqual([{ address: "omar@example-guc.invalid" }]);
    expect(result.message.subject).toBe("Question");
  });

  it("refuses a draft with no recipient", () => {
    const result = validateDraft(draft({ subject: "x", text: "y" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toContainEqual({ code: "no-recipients" });
  });

  it("refuses a malformed recipient anywhere, naming the offending entries", () => {
    const result = validateDraft(draft({ to: "sara@example-guc.invalid", bcc: "oops" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toContainEqual({ code: "invalid-address", entries: ["oops"] });
  });

  it("allows an empty subject and body — people do send those", () => {
    expect(validateDraft(draft({ to: "sara@example-guc.invalid" })).ok).toBe(true);
  });

  it("refuses attachments totalling more than the limit", () => {
    const result = validateDraft(
      draft({
        to: "sara@example-guc.invalid",
        attachments: [attachment(MAX_TOTAL_ATTACHMENT_BYTES), attachment(1, "second.pdf")],
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems[0]).toMatchObject({ code: "attachments-too-large" });
  });
});

describe("totalAttachmentBytes", () => {
  it("sums sizes, and is zero for none", () => {
    expect(totalAttachmentBytes([])).toBe(0);
    expect(totalAttachmentBytes([attachment(100), attachment(50, "b.pdf")])).toBe(150);
  });
});
