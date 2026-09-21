import { isDemoMode } from "../../core/portal/demoMode";
import type { CmsItem } from "./schema";

export interface CmsSource {
  fetch(): Promise<CmsItem[]>;
}

export async function getCmsSource(): Promise<CmsSource> {
  if (await isDemoMode()) {
    const { mockCmsSource } = await import("./mock");
    return mockCmsSource;
  }
  const { liveCmsSource } = await import("./live");
  return liveCmsSource;
}
