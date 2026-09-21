import { useQuery } from "@tanstack/react-query";

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
