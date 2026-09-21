import { gucFetch } from "../../core/http";
import { parseSchedulePage } from "./parser";
import type { ScheduleSource } from "./source";

/**
 * `EXPO_PUBLIC_GUC_PORTAL_HOST` + this path are a PLACEHOLDER, not a confirmed real
 * URL — nobody on this project has seen the live portal yet (docs/DISCOVERY.md,
 * Spike 1 and Spike 3 cover finding the real path and its session/cookie handling).
 * Do not treat this string as fact; replace it once discovery gives us the real one.
 */
const SCHEDULE_PATH = "/schedule"; // TODO(discovery): confirm real path

export const liveScheduleSource: ScheduleSource = {
  async fetch() {
    const host = process.env.EXPO_PUBLIC_GUC_PORTAL_HOST;
    const url = `https://${host}${SCHEDULE_PATH}`;
    const response = await gucFetch(url);
    const html = await response.text();
    return parseSchedulePage(html, url);
  },
};
