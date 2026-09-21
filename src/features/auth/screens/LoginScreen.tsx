import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Screen, Text } from "../../../core/ui";
import { useTheme } from "../../../core/theme";
import { useAuth } from "../../../core/portal";
import { LoginForm } from "../components/LoginForm";

export function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { login, loginWithDemo, unlockWithBiometrics, hasBiometricCredentials } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runAndNavigate = async (action: () => Promise<void>) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await action();
      router.replace("/(tabs)/schedule");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
        <Text variant="title" style={{ textAlign: "center" }}>
          {t("auth.title")}
        </Text>

        <LoginForm isSubmitting={isSubmitting} onSubmit={(values) => runAndNavigate(() => login(values))} />

        {error ? (
          <Text color="danger" style={{ textAlign: "center" }}>
            {error}
          </Text>
        ) : null}

        {hasBiometricCredentials ? (
          <Button
            label={t("auth.biometricUnlock")}
            variant="secondary"
            onPress={() => runAndNavigate(unlockWithBiometrics)}
          />
        ) : null}

        <Button label={t("auth.tryDemo")} variant="ghost" onPress={() => runAndNavigate(loginWithDemo)} />

        <Text variant="caption" color="muted" style={{ textAlign: "center" }}>
          {t("common.unofficialNotice")}
        </Text>
      </View>
    </Screen>
  );
}
