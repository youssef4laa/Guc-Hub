import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { deleteDraft } from "./cache/draftCache";
import {
  readCachedMessage,
  readCachedSummaries,
  updateCachedReadState,
  writeCachedMessage,
  writeCachedSummaries,
} from "./cache/mailCache";
import type { MailFolder, MailPage, MailSort, OutgoingMessage } from "./schema";
import { getMailProvider } from "./source";

export const mailKeys = {
  all: ["mail"] as const,
  folders: () => ["mail", "folders"] as const,
  lists: () => ["mail", "list"] as const,
  list: (folderId: string, sort: MailSort, query: string) => ["mail", "list", folderId, sort, query] as const,
  cachedList: (folderId: string, sort: MailSort) => ["mail", "cached-list", folderId, sort] as const,
  message: (id: string) => ["mail", "message", id] as const,
};

export function useMailFolders() {
  return useQuery({
    queryKey: mailKeys.folders(),
    queryFn: async () => (await getMailProvider()).listFolders(),
  });
}

/**
 * Instant from cache, then refresh: the SQLite copy of the folder's most recent
 * messages is shown as placeholder data while the provider is asked for fresh
 * pages. Search results aren't cached — they always come from the provider.
 */
export function useMessageList({
  folderId,
  sort,
  query,
}: {
  folderId: string;
  sort: MailSort;
  query: string;
}) {
  const isSearch = query.length > 0;

  const cached = useQuery({
    queryKey: mailKeys.cachedList(folderId, sort),
    queryFn: () => readCachedSummaries(folderId, sort),
    enabled: !isSearch && folderId.length > 0,
    staleTime: Infinity,
  });

  const list = useInfiniteQuery({
    queryKey: mailKeys.list(folderId, sort, query),
    enabled: folderId.length > 0,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<MailPage> => {
      const provider = await getMailProvider();
      if (isSearch) return provider.search({ query, folderId, sort, cursor: pageParam });
      const page = await provider.listMessages({ folderId, sort, cursor: pageParam });
      void writeCachedSummaries(folderId, page.messages, { replaceFolder: pageParam === null });
      return page;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData:
      !isSearch && cached.data && cached.data.length > 0
        ? { pages: [{ messages: cached.data, nextCursor: null }], pageParams: [null] }
        : undefined,
  });

  const messages =
    list.data?.pages.flatMap((page) => page.messages) ?? (list.isError ? cached.data : undefined);

  return {
    list,
    messages,
    isShowingCached: list.isPlaceholderData || (list.isError && !!cached.data?.length),
  };
}

/** Falls back to the cached copy when the provider can't be reached. */
export function useMessage(id: string | null) {
  return useQuery({
    queryKey: mailKeys.message(id ?? ""),
    enabled: id !== null,
    queryFn: async () => {
      const messageId = id as string;
      try {
        const message = await (await getMailProvider()).getMessage(messageId);
        void writeCachedMessage(message);
        return message;
      } catch (error) {
        const cachedMessage = await readCachedMessage(messageId);
        if (cachedMessage) return cachedMessage;
        throw error;
      }
    },
  });
}

/** Optimistic: rows and unread counts update immediately, and roll back if the provider fails. */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, isRead }: { ids: string[]; isRead: boolean }) =>
      (await getMailProvider()).markRead(ids, isRead),
    onMutate: async ({ ids, isRead }) => {
      await queryClient.cancelQueries({ queryKey: mailKeys.lists() });
      const previousLists = queryClient.getQueriesData<InfiniteData<MailPage>>({
        queryKey: mailKeys.lists(),
      });
      const previousFolders = queryClient.getQueryData<MailFolder[]>(mailKeys.folders());

      queryClient.setQueriesData<InfiniteData<MailPage>>({ queryKey: mailKeys.lists() }, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) => (ids.includes(m.id) ? { ...m, isRead } : m)),
              })),
            }
          : data,
      );
      void updateCachedReadState(ids, isRead);
      return { previousLists, previousFolders };
    },
    onError: (_error, { ids, isRead }, context) => {
      for (const [key, data] of context?.previousLists ?? []) queryClient.setQueryData(key, data);
      if (context?.previousFolders) queryClient.setQueryData(mailKeys.folders(), context.previousFolders);
      void updateCachedReadState(ids, !isRead);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: mailKeys.folders() });
    },
  });
}

/** Sends, then clears the local draft and refreshes the folders (Sent gains a message). */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message }: { draftId: string; message: OutgoingMessage }) =>
      (await getMailProvider()).send(message),
    onSuccess: async (_result, { draftId }) => {
      await deleteDraft(draftId);
      void queryClient.invalidateQueries({ queryKey: mailKeys.folders() });
      void queryClient.invalidateQueries({ queryKey: mailKeys.lists() });
    },
  });
}
