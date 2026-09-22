import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { EmptyState, ErrorState, Skeleton, Text } from "../../../core/ui";
import type { MailSummary } from "../schema";
import { SwipeableMessageRow } from "./SwipeableMessageRow";

export interface MessageListProps {
  messages: MailSummary[] | undefined;
  isPending: boolean;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: unknown;
  isShowingCached: boolean;
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onEndReached: () => void;
}

export function MessageList({
  messages,
  isPending,
  isRefreshing,
  isFetchingNextPage,
  hasNextPage,
  error,
  isShowingCached,
  query,
  selectedId,
  onSelect,
  onDelete,
  onRefresh,
  onEndReached,
}: MessageListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (isPending && !messages) {
    return (
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <View key={row} style={{ gap: theme.spacing.xs }}>
            <Skeleton style={{ height: 14, width: "40%" }} />
            <Skeleton style={{ height: 14, width: "80%" }} />
            <Skeleton style={{ height: 12, width: "95%" }} />
          </View>
        ))}
      </View>
    );
  }

  // An error with nothing cached to fall back on is the only full-screen error.
  if (error && !messages) return <ErrorState error={error} onRetry={onRefresh} />;

  return (
    <FlatList
      data={messages ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SwipeableMessageRow
          message={item}
          selected={item.id === selectedId}
          onPress={() => onSelect(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.textMuted} />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) onEndReached();
      }}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        isShowingCached && error ? (
          <View style={{ paddingVertical: theme.spacing.sm }}>
            <Text variant="caption" color="muted">
              {t("mail.showingCached")}
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState title={query ? t("mail.emptySearch", { query }) : t("mail.emptyFolder")} />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator style={{ paddingVertical: theme.spacing.lg }} color={theme.colors.textMuted} />
        ) : null
      }
    />
  );
}
