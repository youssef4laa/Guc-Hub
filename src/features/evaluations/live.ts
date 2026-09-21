import { notImplemented } from "../../core/portal/PortalError";
import type { EvaluationsSource } from "./source";

export const liveEvaluationsSource: EvaluationsSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> evaluationsItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("evaluations");
  },
};
