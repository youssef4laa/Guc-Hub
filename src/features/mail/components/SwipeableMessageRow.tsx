import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { View } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { useTheme } from "../../../core/theme";
import type { MailSummary } from "../schema";
import { MessageListItem } from "./MessageListItem";

/**
 * Swipe left on a row to delete it. The delete is optimistic and undoable (see
 * useDeleteWithUndo), so nothing here asks for confirmation — the undo bar is
 * the confirmation, and it doesn't interrupt anyone who meant it.
 */
export function SwipeableMessageRow({
  message,
  selected,
  onPress,
  onDelete,
}: {
  message: MailSummary;
  selected: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { theme } = useTheme();
  const swipeable = useRef<SwipeableMethods | null>(null);

  return (
    <Swipeable
      ref={swipeable}
      friction={2}
      rightThreshold={48}
      overshootRight={false}
      onSwipeableOpen={() => {
        // Close first: the row is about to disappear from the list, and a
        // still-open swipe would otherwise flash on the row that replaces it.
        swipeable.current?.close();
        onDelete();
      }}
      renderRightActions={() => (
        <View
          style={{
            backgroundColor: theme.colors.danger,
            justifyContent: "center",
            alignItems: "flex-end",
            paddingHorizontal: theme.spacing.lg,
            flex: 1,
          }}
        >
          <Ionicons name="trash-outline" size={22} color={theme.colors.onPrimary} />
        </View>
      )}
    >
      <View style={{ backgroundColor: theme.colors.background }}>
        <MessageListItem message={message} selected={selected} onPress={onPress} onDelete={onDelete} />
      </View>
    </Swipeable>
  );
}
