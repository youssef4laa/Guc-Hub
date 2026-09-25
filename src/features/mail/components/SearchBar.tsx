import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

import { useTheme } from "../../../core/theme";

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.md,
        minHeight: 44,
      }}
    >
      <Ionicons name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        accessibilityLabel={t("mail.searchPlaceholder")}
        placeholder={t("mail.searchPlaceholder")}
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={{ flex: 1, color: theme.colors.text, paddingVertical: theme.spacing.sm }}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("mail.clearSearch")}
          onPress={() => onChange("")}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
