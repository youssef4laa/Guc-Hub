import { notImplemented } from "../../core/portal/PortalError";
import type { TemplateSource } from "./source";

export const liveTemplateSource: TemplateSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> templateItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("_template");
  },
};
