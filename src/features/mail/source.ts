import { isDemoMode } from "../../core/portal/demoMode";
import type { MailProvider } from "./provider";

let mockInstance: MailProvider | null = null;

/** Screens and hooks only ever go through this — never `mock.ts` or `live.ts` directly. */
export async function getMailProvider(): Promise<MailProvider> {
  if (await isDemoMode()) {
    if (!mockInstance) {
      const { MockMailProvider } = await import("./mock");
      // One instance per app session, so reads/deletes persist while the demo runs.
      mockInstance = new MockMailProvider();
    }
    return mockInstance;
  }
  const { liveMailProvider } = await import("./live");
  return liveMailProvider;
}
