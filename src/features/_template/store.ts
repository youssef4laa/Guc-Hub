import { useQuery } from "@tanstack/react-query";

import { getTemplateSource } from "./source";

export function useTemplateItems() {
  return useQuery({
    queryKey: ["_template", "items"],
    queryFn: async () => {
      const source = await getTemplateSource();
      return source.fetch();
    },
  });
}
