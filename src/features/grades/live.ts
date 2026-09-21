import { notImplemented } from "../../core/portal/PortalError";
import type { GradesSource } from "./source";

export const liveGradesSource: GradesSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> gradesItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("grades");
  },
};
