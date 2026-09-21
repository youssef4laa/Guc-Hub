import { notImplemented } from "../../core/portal/PortalError";
import type { MailSource } from "./source";

export const liveMailSource: MailSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> mailItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("mail");
  },
};
