import { useQuery } from "@tanstack/react-query";

import type { CmsFile, CmsFileType, CmsItem } from "./schema";
import { getCmsSource } from "./source";

export function useCmsItems() {
  return useQuery({
    queryKey: ["cms", "items"],
    queryFn: async () => {
      const source = await getCmsSource();
      return source.fetch();
    },
  });
}

export type CmsFilter = "all" | CmsFileType;

export function filterFiles(files: CmsFile[], filter: CmsFilter): CmsFile[] {
  return files
    .filter((f) => filter === "all" || f.type === filter)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export function isUnseen(file: CmsFile, locallySeen: ReadonlySet<string>): boolean {
  return !file.seen && !locallySeen.has(file.id);
}

export function unseenCount(courses: CmsItem[], locallySeen: ReadonlySet<string>): number {
  return courses.reduce((sum, c) => sum + c.files.filter((f) => isUnseen(f, locallySeen)).length, 0);
}

export function relativeDays(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
