import { View } from "react-native";

import { useTheme } from "../theme";
import { Text } from "./Text";

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: "center", padding: theme.spacing.xl, gap: theme.spacing.sm }}>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="muted" style={{ textAlign: "center" }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
