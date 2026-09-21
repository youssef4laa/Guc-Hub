import { notImplemented } from "../../core/portal/PortalError";
import type { CmsSource } from "./source";

export const liveCmsSource: CmsSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> cmsItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("cms");
  },
};
