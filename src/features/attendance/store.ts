import { useQuery } from "@tanstack/react-query";

import { getAttendanceSource } from "./source";

export function useAttendanceItems() {
  return useQuery({
    queryKey: ["attendance", "items"],
    queryFn: async () => {
      const source = await getAttendanceSource();
      return source.fetch();
    },
  });
}
