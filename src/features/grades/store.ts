import { useQuery } from "@tanstack/react-query";

import { getGradesSource } from "./source";

export function useGradesItems() {
  return useQuery({
    queryKey: ["grades", "items"],
    queryFn: async () => {
      const source = await getGradesSource();
      return source.fetch();
    },
  });
}
