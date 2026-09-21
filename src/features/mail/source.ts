import { isDemoMode } from "../../core/portal/demoMode";
import type { MailItem } from "./schema";

export interface MailSource {
  fetch(): Promise<MailItem[]>;
}

export async function getMailSource(): Promise<MailSource> {
  if (await isDemoMode()) {
    const { mockMailSource } = await import("./mock");
    return mockMailSource;
  }
  const { liveMailSource } = await import("./live");
  return liveMailSource;
}
