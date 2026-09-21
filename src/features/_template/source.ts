import { isDemoMode } from "../../core/portal/demoMode";
import type { TemplateItem } from "./schema";

export interface TemplateSource {
  fetch(): Promise<TemplateItem[]>;
}

export async function getTemplateSource(): Promise<TemplateSource> {
  if (await isDemoMode()) {
    const { mockTemplateSource } = await import("./mock");
    return mockTemplateSource;
  }
  const { liveTemplateSource } = await import("./live");
  return liveTemplateSource;
}
