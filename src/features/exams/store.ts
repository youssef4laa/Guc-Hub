import { useQuery } from "@tanstack/react-query";

import { getExamsSource } from "./source";

export function useExamsItems() {
  return useQuery({
    queryKey: ["exams", "items"],
    queryFn: async () => {
      const source = await getExamsSource();
      return source.fetch();
    },
  });
}
