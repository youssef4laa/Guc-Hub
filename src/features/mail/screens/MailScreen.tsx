import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Screen } from "../../../core/ui";
import { FolderBar } from "../components/FolderBar";
import { MessageList } from "../components/MessageList";
import { MessageReader, NoMessageSelected } from "../components/MessageReader";
import { SearchBar } from "../components/SearchBar";
import { SortBar } from "../components/SortBar";
import { UndoBar } from "../components/UndoBar";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useDeleteWithUndo } from "../hooks/useDeleteWithUndo";
import { useMailLayout } from "../hooks/useMailLayout";
import type { MailSort } from "../schema";
import { useMailFolders, useMessageList } from "../store";
import { ComposeScreen } from "./ComposeScreen";

export function MailScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { twoPane, listPaneWidth } = useMailLayout();

  const [folderId, setFolderId] = useState("");
  const [sort, setSort] = useState<MailSort>("newest");
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeDraftId, setComposeDraftId] = useState<string | null>(null);
  const query = useDebouncedValue(searchText.trim(), 300);

  const folders = useMailFolders();
  // Default to the inbox (whatever the provider calls it) on first load.
  const defaultFolderId = folders.data?.find((f) => f.role === "inbox")?.id ?? folders.data?.[0]?.id ?? "";
  const activeFolderId = folderId || defaultFolderId;

  const { list, messages, isShowingCached } = useMessageList({ folderId: activeFolderId, sort, query });
  const deletion = useDeleteWithUndo();

  const deleteMessage = (id: string) => {
    if (selectedId === id) setSelectedId(null);
    deletion.remove([id]);
  };

  // On phones the reader replaces the list, so Android's back button should
  // return to the list rather than leaving the tab.
  useEffect(() => {
    const canGoBack = composeDraftId !== null || (!twoPane && selectedId !== null);
    if (!canGoBack) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (composeDraftId !== null) setComposeDraftId(null);
      else setSelectedId(null);
      return true;
    });
    return () => subscription.remove();
  }, [twoPane, selectedId, composeDraftId]);

  const startCompose = () => setComposeDraftId(`draft-${Date.now()}`);

  const mailbox = (
    <View style={{ flex: 1, gap: theme.spacing.xs }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchBar value={searchText} onChange={setSearchText} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("mail.composeNew")}
          onPress={startCompose}
          hitSlop={8}
          style={{ padding: theme.spacing.sm }}
        >
          <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>
      {folders.data ? (
        <FolderBar
          folders={folders.data}
          selectedId={activeFolderId}
          onSelect={(id) => {
            setFolderId(id);
            setSelectedId(null);
          }}
        />
      ) : null}
      <SortBar sort={sort} onChange={setSort} />
      <MessageList
        messages={messages}
        isPending={list.isPending}
        isRefreshing={list.isRefetching && !list.isFetchingNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        hasNextPage={list.hasNextPage}
        error={list.error}
        isShowingCached={isShowingCached}
        query={query}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDelete={deleteMessage}
        onRefresh={() => list.refetch()}
        onEndReached={() => list.fetchNextPage()}
      />
    </View>
  );

  if (composeDraftId) {
    return (
      <Screen style={{ padding: 0 }}>
        <ComposeScreen draftId={composeDraftId} onClose={() => setComposeDraftId(null)} />
      </Screen>
    );
  }

  const undoBar = deletion.pending ? <UndoBar count={deletion.pending.count} onUndo={deletion.undo} /> : null;

  if (twoPane) {
    return (
      <Screen style={{ padding: 0 }}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ width: listPaneWidth, paddingHorizontal: theme.spacing.lg }}>{mailbox}</View>
          <View style={{ width: 1, backgroundColor: theme.colors.border }} />
          <View style={{ flex: 1 }}>
            {selectedId ? <MessageReader key={selectedId} id={selectedId} /> : <NoMessageSelected />}
          </View>
        </View>
        {undoBar}
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      {selectedId ? (
        <MessageReader key={selectedId} id={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>{mailbox}</View>
          {undoBar}
        </>
      )}
    </Screen>
  );
}
