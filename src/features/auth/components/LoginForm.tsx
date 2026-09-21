import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Button } from "../../../core/ui";
import { loginFormSchema, type LoginFormValues } from "../schema";

export function LoginForm({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean;
  onSubmit: (values: LoginFormValues) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    const result = loginFormSchema.safeParse({ username, password });
    if (result.success) onSubmit(result.data);
  };

  const inputStyle = [
    styles.input,
    { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface },
  ];

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <TextInput
        accessibilityLabel={t("auth.usernameLabel")}
        placeholder={t("auth.usernameLabel")}
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
        style={inputStyle}
      />
      <TextInput
        accessibilityLabel={t("auth.passwordLabel")}
        placeholder={t("auth.passwordLabel")}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={inputStyle}
      />
      <Button label={t("auth.signIn")} onPress={submit} loading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
});
