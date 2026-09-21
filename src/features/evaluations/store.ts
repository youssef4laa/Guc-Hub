import { useQuery } from "@tanstack/react-query";

import { getEvaluationsSource } from "./source";

export function useEvaluationsItems() {
  return useQuery({
    queryKey: ["evaluations", "items"],
    queryFn: async () => {
      const source = await getEvaluationsSource();
      return source.fetch();
    },
  });
}
