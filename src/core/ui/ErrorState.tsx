import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { PortalError, type PortalErrorCode } from "../portal/PortalError";
import { useTheme } from "../theme";
import { Button } from "./Button";
import { Text } from "./Text";

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Shown when the code is PARSE_FAILED and the error carries a sourceUrl. */
  onOpenOriginal?: (url: string) => void;
}

const MESSAGES: Record<PortalErrorCode, string> = {
  AUTH_INVALID: "auth.invalidCredentials",
  SESSION_EXPIRED: "common.sessionExpired",
  PORTAL_UNAVAILABLE: "common.portalUnavailable",
  PARSE_FAILED: "common.parseFailed",
  TRANSCRIPT_LOCKED: "common.parseFailed",
  NOT_IMPLEMENTED: "common.notImplemented",
  OFFLINE: "common.offline",
};

/**
 * Renders every `PortalError` uniformly. This is the one place UI copy for portal
 * failures lives — features should never write their own "something went wrong".
 */
export function ErrorState({ error, onRetry, onOpenOriginal }: ErrorStateProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const code: PortalErrorCode = error instanceof PortalError ? error.code : "PORTAL_UNAVAILABLE";
  const sourceUrl = error instanceof PortalError ? error.sourceUrl : undefined;
  const message = error instanceof Error ? error.message : t(MESSAGES[code]);

  return (
    <View style={{ alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.xl }}>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {t(MESSAGES[code])}
      </Text>
      <Text variant="caption" color="muted" style={{ textAlign: "center" }}>
        {message}
      </Text>
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        {onRetry ? <Button label={t("common.retry")} variant="secondary" onPress={onRetry} /> : null}
        {code === "PARSE_FAILED" && sourceUrl && onOpenOriginal ? (
          <Button label={t("common.openOriginal")} onPress={() => onOpenOriginal(sourceUrl)} />
        ) : null}
      </View>
    </View>
  );
}
