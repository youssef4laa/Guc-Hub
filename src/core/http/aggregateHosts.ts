/** Flattens every feature's declared hosts into one deduped allowlist. */
export function aggregateHosts(perFeatureHostLists: string[][]): string[] {
  return [...new Set(perFeatureHostLists.flat().filter(Boolean))];
}
