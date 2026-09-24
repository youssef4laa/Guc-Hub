import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { probeUrl, type ProbeResult } from "../../http/probe";
import { useTheme } from "../../theme";
import { Button, Card, Screen, Text } from "../../ui";

function defaultUrl(): string {
  const host = process.env.EXPO_PUBLIC_GUC_PORTAL_HOST;
  return host ? `https://${host}/` : "";
}

/** Plain-text rendering so the user can long-press, select and paste it back. Names/schemes only. */
export function formatProbe(result: ProbeResult): string {
  const lines = result.hops.map((hop, i) => {
    const parts = [
      `#${i + 1} ${hop.status} ${hop.host}${hop.path}`,
      hop.redirectTo ? `  -> redirects to ${hop.redirectTo}` : null,
      `  WWW-Authenticate schemes: ${hop.authSchemes.join(", ") || "(none)"}`,
      `  Set-Cookie names: ${hop.cookieNames.join(", ") || "(none)"}`,
      `  response header names: ${hop.headerNames.join(", ")}`,
    ];
    return parts.filter(Boolean).join("\n");
  });
  lines.push(`stopped: ${result.stoppedBecause}${result.error ? ` (${result.error})` : ""}`);
  return lines.join("\n\n");
}

/**
 * Dev-only (route redirects away outside __DEV__). Sends NO credentials. Output is
 * hosts/paths/scheme names/cookie names only, safe to paste into the spike doc.
 */
export function AuthProbeScreen() {
  const { theme } = useTheme();
  const [url, setUrl] = useState(defaultUrl);
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setOutput(null);
    try {
      setOutput(formatProbe(await probeUrl(url)));
    } catch (error) {
      setOutput(`error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md }}>
        <Text variant="heading">Auth probe</Text>
        <Text variant="caption" color="muted">
          Unauthenticated GET, redirects followed by hand. Sends no credentials. The host must be in the
          allowlist (set EXPO_PUBLIC_GUC_PORTAL_HOST / EXPO_PUBLIC_GUC_MAIL_HOST in .env.local).
        </Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://host/path"
          placeholderTextColor={theme.colors.textMuted}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            minHeight: 44,
            color: theme.colors.text,
          }}
        />
        <Button label="Run probe" onPress={run} loading={busy} disabled={!url} />
        {output ? (
          <Card>
            <View>
              <Text selectable variant="caption" style={{ fontFamily: "monospace" }}>
                {output}
              </Text>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
