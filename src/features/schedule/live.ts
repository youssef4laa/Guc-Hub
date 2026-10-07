import { notImplemented } from "../../core/portal/PortalError";
import type { ScheduleSource } from "./source";

/**
 * No live schedule source exists. The real portal URL was never confirmed (see
 * docs/DISCOVERY.md, Spikes 1 and 3), and this project does not guess GUC URLs.
 * The parser in ./parser.ts is exercised against a fixture only.
 */
export const liveScheduleSource: ScheduleSource = {
  async fetch() {
    notImplemented("schedule");
  },
};
