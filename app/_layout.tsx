import "react-native-reanimated";
import "../src/core/i18n";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuth } from "../src/core/portal";
import { QueryProvider } from "../src/core/query";
import { ThemeProvider, useTheme } from "../src/core/theme";
import { OfflineBanner } from "../src/core/ui";

function useProtectedRoute(isAuthenticated: boolean, isBootstrapping: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isBootstrapping) return;
    const inTabsGroup = segments[0] === "(tabs)";

    if (!isAuthenticated && inTabsGroup) {
      router.replace("/login");
    } else if (isAuthenticated && segments[0] === "login") {
      router.replace("/(tabs)/schedule");
    }
  }, [isAuthenticated, isBootstrapping, segments, router]);
}

function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { theme, themeName } = useTheme();
  useProtectedRoute(isAuthenticated, isBootstrapping);

  if (isBootstrapping) return null;

  return (
    <>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />
      <OfflineBanner />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="webview"
          options={{ headerShown: true, presentation: "modal", title: "Original page" }}
        />
        <Stack.Screen name="dev/ui" options={{ headerShown: true, title: "UI gallery" }} />
        <Stack.Screen name="dev/capture" options={{ headerShown: true, title: "Capture page" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
