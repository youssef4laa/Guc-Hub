import { useQuery } from "@tanstack/react-query";

import { getFlappySource } from "./source";

export function useFlappyItems() {
  return useQuery({
    queryKey: ["flappy", "items"],
    queryFn: async () => {
      const source = await getFlappySource();
      return source.fetch();
    },
  });
}
