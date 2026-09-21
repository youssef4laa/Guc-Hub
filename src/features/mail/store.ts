import { useQuery } from "@tanstack/react-query";

import { getMailSource } from "./source";

export function useMailItems() {
  return useQuery({
    queryKey: ["mail", "items"],
    queryFn: async () => {
      const source = await getMailSource();
      return source.fetch();
    },
  });
}
