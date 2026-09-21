import { useQuery } from "@tanstack/react-query";

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
