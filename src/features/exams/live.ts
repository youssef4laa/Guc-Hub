import { notImplemented } from "../../core/portal/PortalError";
import type { ExamsSource } from "./source";

export const liveExamsSource: ExamsSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> examsItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("exams");
  },
};
