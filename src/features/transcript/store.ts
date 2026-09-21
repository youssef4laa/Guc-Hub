import { useQuery } from "@tanstack/react-query";

import { getTranscriptSource } from "./source";

export function useTranscriptItems() {
  return useQuery({
    queryKey: ["transcript", "items"],
    queryFn: async () => {
      const source = await getTranscriptSource();
      return source.fetch();
    },
  });
}
