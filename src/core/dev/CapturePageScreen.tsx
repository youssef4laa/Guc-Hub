import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { gucFetch } from "../http";
import { createLogger } from "../logging";
import { useTheme } from "../theme";
import { Button, Card, Screen, Text } from "../ui";

const log = createLogger("capture-page");

/**
 * Dev-build-only. Fetches a real page through the CURRENT authenticated session,
 * on the real device network stack (so it sees whatever auth/session GUC's portal
 * actually needs — no separate scraping infra), then hands the raw HTML to the
 * share sheet. Save the shared file under `fixtures/<feature>/raw.local/`
 * (gitignored), then run `pnpm sanitize-fixture` before it can be committed to
 * `fixtures/<feature>/raw/`. This is the ONLY sanctioned way real portal markup
 * enters this repo — never hand-write or guess at captured HTML.
 */
export function CapturePageScreen() {
  const { theme } = useTheme();
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const capture = async () => {
    if (!path) return;
    setIsBusy(true);
    setStatus(null);
    try {
      const host = process.env.EXPO_PUBLIC_GUC_PORTAL_HOST;
      const url = path.startsWith("http") ? path : `https://${host}${path}`;
      const response = await gucFetch(url, { bypassCache: true });
      const html = await response.text();

      const file = new File(Paths.cache, `capture-${Date.now()}.html`);
      file.create();
      file.write(html);
      log.info("captured page", { url, bytes: html.length });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "text/html", dialogTitle: "Save captured page" });
      }
      setStatus(
        `Captured ${html.length} bytes. Save it under fixtures/<feature>/raw.local/, ` +
          `then run: pnpm sanitize-fixture <path> fixtures/<feature>/raw/<name>.html`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="heading">Capture page</Text>
        <Text variant="caption" color="muted">
          Fetches a path on the GUC portal host through your current session and shares the raw HTML. Dev
          builds only — never ships in a release build&apos;s user-facing flow.
        </Text>
        <TextInput
          placeholder="/path/on/the/portal or a full https:// URL"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={path}
          onChangeText={setPath}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            minHeight: 44,
            color: theme.colors.text,
          }}
        />
        <Button label="Capture" onPress={capture} loading={isBusy} disabled={!path} />
        {status ? (
          <Card>
            <Text variant="caption">{status}</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
