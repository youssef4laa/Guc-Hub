import { useQuery } from "@tanstack/react-query";

import type { StaffItem } from "./schema";
import { getStaffSource } from "./source";

export function useStaffItems() {
  return useQuery({
    queryKey: ["staff", "items"],
    queryFn: async () => {
      const source = await getStaffSource();
      return source.fetch();
    },
  });
}

/** Case-insensitive match on name, department or any course code; empty query keeps everyone. */
export function searchStaff(staff: StaffItem[], query: string): StaffItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return staff;
  return staff.filter((s) =>
    [s.name, s.department, s.title, ...s.courses].some((field) => field.toLowerCase().includes(q)),
  );
}
