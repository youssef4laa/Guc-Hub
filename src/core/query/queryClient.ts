import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

import { PortalError } from "../portal/PortalError";

/**
 * Stale-then-refresh everywhere: screens render instantly from the persisted cache,
 * then revalidate in the background. `retry` skips PortalError codes that a retry
 * can never fix (bad auth, unimplemented parser, locked transcript).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount, error) => {
        if (error instanceof PortalError) {
          const nonRetryable: PortalError["code"][] = [
            "AUTH_INVALID",
            "NOT_IMPLEMENTED",
            "TRANSCRIPT_LOCKED",
            "PARSE_FAILED",
          ];
          if (nonRetryable.includes(error.code)) return false;
        }
        return failureCount < 2;
      },
      refetchOnReconnect: true,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "guc-hub.query-cache",
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};
