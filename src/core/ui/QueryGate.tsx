import { useRouter } from "expo-router";
import type { ReactNode } from "react";

import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Screen } from "./Screen";
import { Skeleton } from "./Skeleton";

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => unknown;
}

export interface QueryGateProps<T> {
  query: QueryLike<T[]>;
  emptyTitle: string;
  emptyMessage?: string;
  children: (data: T[]) => ReactNode;
}

/**
 * The loading / error / empty states every list feature needs, in one place, so a
 * feature screen only writes its happy path. Error copy still comes from `ErrorState`
 * (`PARSE_FAILED` offers "Open original page").
 */
export function QueryGate<T>({ query, emptyTitle, emptyMessage, children }: QueryGateProps<T>) {
  const router = useRouter();

  if (query.isPending) {
    return (
      <Screen>
        <Skeleton style={{ height: 72, marginBottom: 12, borderRadius: 16 }} />
        <Skeleton style={{ height: 72, marginBottom: 12, borderRadius: 16 }} />
        <Skeleton style={{ height: 72, marginBottom: 12, borderRadius: 16 }} />
      </Screen>
    );
  }

  if (query.error) {
    return (
      <Screen>
        <ErrorState
          error={query.error}
          onRetry={() => void query.refetch()}
          onOpenOriginal={(url) => router.push({ pathname: "/webview", params: { url } })}
        />
      </Screen>
    );
  }

  if (!query.data || query.data.length === 0) {
    return (
      <Screen>
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </Screen>
    );
  }

  return <Screen>{children(query.data)}</Screen>;
}
