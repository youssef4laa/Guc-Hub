import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform } from "react-native";
import { WebView } from "react-native-webview";

import { createLogger } from "../../../core/logging";
import { decideNavigation, EMAIL_BASE_URL } from "../security/navigationPolicy";

const log = createLogger("mail-webview");

/**
 * Renders an already-sanitized email document (see security/emailDocument.ts).
 *
 * Three independent layers keep untrusted email from doing anything:
 *   1. the sanitizer stripped scripts, forms, frames and remote references;
 *   2. this WebView runs with JavaScript disabled and no storage/cookies;
 *   3. the document carries a Content-Security-Policy that blocks what's left.
 *
 * `originWhitelist` is deliberately `["*"]`: react-native-webview hands any URL
 * *outside* the whitelist straight to `Linking.openURL` without asking
 * (WebViewShared.createOnShouldStartLoadWithRequest), which is exactly the
 * silent navigation we must prevent. Allowing everything through the whitelist
 * routes every navigation into our own handler below instead.
 */
export function SafeEmailView({ html }: { html: string }) {
  const { t } = useTranslation();
  const isAsking = useRef(false);

  const confirmOpen = (url: string, host: string) => {
    if (isAsking.current) return;
    isAsking.current = true;
    Alert.alert(t("mail.openLinkTitle"), t("mail.openLinkMessage", { host, url }), [
      { text: t("mail.cancel"), style: "cancel", onPress: () => (isAsking.current = false) },
      {
        text: t("mail.open"),
        onPress: () => {
          isAsking.current = false;
          Linking.openURL(url).catch((error) => log.warn("could not open link", { name: error?.name }));
        },
      },
    ]);
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html, baseUrl: EMAIL_BASE_URL }}
      onShouldStartLoadWithRequest={(request) => {
        const decision = decideNavigation(request.url);
        if (decision.action === "allow") return true;
        if (decision.action === "confirm-external") confirmOpen(decision.url, decision.host);
        return false;
      }}
      javaScriptEnabled={false}
      javaScriptCanOpenWindowsAutomatically={false}
      setSupportMultipleWindows={false}
      domStorageEnabled={false}
      thirdPartyCookiesEnabled={false}
      sharedCookiesEnabled={false}
      incognito
      cacheEnabled={false}
      allowFileAccess={false}
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      allowsLinkPreview={false}
      // iOS-only prop: on Android the Fabric view aborts the whole app (RawValue castValue).
      dataDetectorTypes={Platform.OS === "ios" ? "none" : undefined}
      mixedContentMode="never"
      mediaPlaybackRequiresUserAction
      allowsInlineMediaPlayback={false}
      geolocationEnabled={false}
      style={{ flex: 1, backgroundColor: "#ffffff" }}
    />
  );
}
