import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { features } from "../../../core/registry";
import { useTheme } from "../../../core/theme";
import { Screen, Text } from "../../../core/ui";

/**
 * Built entirely from the registry — adding a feature never means adding a row
 * here by hand. `settings` is pinned last since it's not "content".
 */
export function MoreScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const rows = features
    .filter((f) => f.id !== "auth" && f.id !== "settings")
    .sort((a, b) => a.order - b.order);

  return (
    <Screen>
      <View style={{ gap: theme.spacing.xs }}>
        {rows.map((feature) => (
          <Pressable
            key={feature.id}
            accessibilityRole="button"
            onPress={() => router.push(feature.route as never)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.sm,
              borderRadius: theme.radii.md,
              backgroundColor: pressed ? theme.colors.surface : "transparent",
              opacity: feature.enabled ? 1 : 0.6,
            })}
          >
            <Ionicons name={feature.icon as never} size={22} color={theme.colors.text} />
            <Text style={{ flex: 1 }}>{feature.title}</Text>
            {!feature.enabled ? (
              <Text variant="caption" color="muted">
                Coming soon
              </Text>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            )}
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/settings")}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radii.md,
            backgroundColor: pressed ? theme.colors.surface : "transparent",
            marginTop: theme.spacing.md,
          })}
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
          <Text style={{ flex: 1 }}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </Screen>
  );
}
