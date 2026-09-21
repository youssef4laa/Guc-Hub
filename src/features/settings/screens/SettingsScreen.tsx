import { useRouter } from "expo-router";
import { View } from "react-native";

import { useAuth } from "../../../core/portal";
import { useTheme, type ThemePreference } from "../../../core/theme";
import { Button, Card, Screen, Text } from "../../../core/ui";

const PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

export function SettingsScreen() {
  const { theme, preference, setPreference } = useTheme();
  const { demoMode, logout } = useAuth();
  const router = useRouter();

  return (
    <Screen>
      <View style={{ gap: theme.spacing.lg }}>
        <Card>
          <Text variant="heading" style={{ marginBottom: theme.spacing.sm }}>
            Appearance
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {PREFERENCES.map((option) => (
              <Button
                key={option}
                label={option}
                variant={preference === option ? "primary" : "secondary"}
                onPress={() => setPreference(option)}
              />
            ))}
          </View>
        </Card>

        {__DEV__ ? (
          <Card>
            <Text variant="heading" style={{ marginBottom: theme.spacing.sm }}>
              Developer
            </Text>
            <Button label="UI component gallery" variant="secondary" onPress={() => router.push("/dev/ui")} />
            <View style={{ height: theme.spacing.sm }} />
            <Button label="Capture page" variant="secondary" onPress={() => router.push("/dev/capture")} />
          </Card>
        ) : null}

        <Card>
          <Text variant="caption" color="muted">
            {demoMode
              ? "You're in demo mode — no real GUC account is connected."
              : "Signed in to your GUC account."}
          </Text>
        </Card>

        <Button
          label="Sign out"
          variant="secondary"
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        />

        <Text variant="caption" color="muted" style={{ textAlign: "center" }}>
          Guc Hub is an unofficial, student-built app. Always verify important things (grades, deadlines, exam
          rooms) on the official GUC portal.
        </Text>
      </View>
    </Screen>
  );
}
