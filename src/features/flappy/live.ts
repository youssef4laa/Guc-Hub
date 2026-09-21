import { notImplemented } from "../../core/portal/PortalError";
import type { FlappySource } from "./source";

export const liveFlappySource: FlappySource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> flappyItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("flappy");
  },
};
