import { notImplemented } from "../../core/portal/PortalError";
import type { StaffSource } from "./source";

export const liveStaffSource: StaffSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> staffItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("staff");
  },
};
