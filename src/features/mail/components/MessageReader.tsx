import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Button, EmptyState, ErrorState, Skeleton, Text } from "../../../core/ui";
import { formatBytes, formatFullDate } from "../logic/format";
import { bodyToPlainText } from "../logic/text";
import { classifyAttachment } from "../security/attachments";
import { senderLabel } from "../logic/sorting";
import type { AttachmentMeta, MailAddress, MailMessage } from "../schema";
import { buildEmailDocument } from "../security/emailDocument";
import { useMarkRead, useMessage, useShareAttachment } from "../store";
import { SafeEmailView } from "./SafeEmailView";

export function MessageReader({ id, onBack }: { id: string; onBack?: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { data: message, error, isPending, refetch } = useMessage(id);
  const markRead = useMarkRead();
  // Allowing remote content is a per-message decision that must never persist to
  // the next message. Callers mount this component with `key={id}` (see
  // MailScreen), so opening another message remounts it and re-blocks by default.
  const [allowRemoteContent, setAllowRemoteContent] = useState(false);

  const shouldMarkRead = message?.isRead === false;
  useEffect(() => {
    if (shouldMarkRead) markRead.mutate({ ids: [id], isRead: true });
    // Only when the opened message is unread — markRead is stable enough to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shouldMarkRead]);

  const document = useMemo(
    () =>
      message?.body.kind === "html" ? buildEmailDocument(message.body.html, { allowRemoteContent }) : null,
    [message, allowRemoteContent],
  );

  if (isPending) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Skeleton style={{ height: 22, width: "70%" }} />
        <Skeleton style={{ height: 14, width: "45%" }} />
        <Skeleton style={{ height: 200 }} />
      </View>
    );
  }

  if (error || !message) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.xs }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("mail.back")}
            onPress={onBack}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 }}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
            <Text color="primary">{t("mail.back")}</Text>
          </Pressable>
        ) : null}

        <Text variant="heading">{message.subject.trim() || t("mail.noSubject")}</Text>
        <Text variant="caption" color="muted">
          {senderLabel(message)} · {message.from.address}
        </Text>
        <Text variant="caption" color="muted">
          {t("mail.to")}: {addressList(message.to)}
          {message.cc.length > 0 ? ` · ${t("mail.cc")}: ${addressList(message.cc)}` : ""}
        </Text>
        <Text variant="caption" color="muted">
          {formatFullDate(message.date)}
        </Text>

        {message.attachments.length > 0 ? <Attachments message={message} /> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("mail.shareMessage")}
          onPress={() => void shareMessage(message, t("mail.noSubject"))}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 }}
        >
          <Ionicons name="share-outline" size={16} color={theme.colors.primary} />
          <Text variant="caption" color="primary">
            {t("mail.shareMessage")}
          </Text>
        </Pressable>

        {document && document.blockedRemoteCount > 0 ? (
          <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
            <Text variant="caption" color="muted">
              {t("mail.remoteBlocked", { count: document.blockedRemoteCount })}
            </Text>
            <Button
              label={t("mail.loadImages")}
              variant="secondary"
              onPress={() => setAllowRemoteContent(true)}
            />
          </View>
        ) : null}
      </View>

      {message.body.kind === "html" && document ? (
        <SafeEmailView html={document.html} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
          <Text selectable>{message.body.kind === "text" ? message.body.text : ""}</Text>
        </ScrollView>
      )}
    </View>
  );
}

function Attachments({ message }: { message: MailMessage }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const share = useShareAttachment();

  /**
   * Nothing opens without the reader saying so, and an attachment that the OS
   * might execute — or that hides its real type behind a second extension — says
   * so in the dialog. The extension shown is the real one, after sanitising.
   */
  const confirmAndShare = (attachment: AttachmentMeta) => {
    const { isExecutable, hasDoubleExtension, extension } = classifyAttachment(attachment.filename);
    const warning = isExecutable
      ? t("mail.attachmentExecutableWarning", { extension })
      : hasDoubleExtension
        ? t("mail.attachmentDoubleExtensionWarning", { extension })
        : "";

    Alert.alert(
      t("mail.openAttachmentTitle"),
      `${attachment.filename}\n${formatBytes(attachment.sizeBytes)}${warning ? `\n\n${warning}` : ""}`,
      [
        { text: t("mail.cancel"), style: "cancel" },
        {
          text: t("mail.share"),
          style: isExecutable ? "destructive" : "default",
          onPress: () =>
            share.mutate({
              messageId: message.id,
              attachmentId: attachment.id,
              dialogTitle: attachment.filename,
            }),
        },
      ],
    );
  };

  return (
    <View style={{ gap: 2, marginTop: theme.spacing.xs }}>
      <Text variant="caption" style={{ fontWeight: "600" }}>
        {t("mail.attachments", { count: message.attachments.length })}
      </Text>
      {message.attachments.map((attachment) => {
        const { isExecutable } = classifyAttachment(attachment.filename);
        return (
          <Pressable
            key={attachment.id}
            accessibilityRole="button"
            accessibilityLabel={t("mail.openAttachmentLabel", {
              name: attachment.filename,
              size: formatBytes(attachment.sizeBytes),
            })}
            onPress={() => confirmAndShare(attachment)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}
          >
            <Ionicons
              name={isExecutable ? "warning-outline" : "document-outline"}
              size={14}
              color={isExecutable ? theme.colors.warning : theme.colors.textMuted}
            />
            <Text variant="caption" color="muted" numberOfLines={1} style={{ flex: 1 }}>
              {attachment.filename} · {formatBytes(attachment.sizeBytes)}
            </Text>
            <Ionicons name="share-outline" size={14} color={theme.colors.primary} />
          </Pressable>
        );
      })}
      {share.isPending ? <ActivityIndicator style={{ alignSelf: "flex-start" }} /> : null}
      {share.isError ? (
        <Text variant="caption" color="danger">
          {share.error instanceof Error ? share.error.message : t("mail.attachmentFailed")}
        </Text>
      ) : null}
    </View>
  );
}

/** Shares the message as plain text — never its raw HTML, which is untrusted. */
async function shareMessage(message: MailMessage, fallbackSubject: string): Promise<void> {
  const subject = message.subject.trim() || fallbackSubject;
  await Share.share({ title: subject, message: `${subject}\n\n${bodyToPlainText(message.body)}` });
}

function addressList(addresses: MailAddress[]): string {
  return addresses.map((address) => address.name?.trim() || address.address).join(", ");
}

/** Shown in the tablet reader pane when nothing is selected yet. */
export function NoMessageSelected() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <EmptyState title={t("mail.selectMessage")} />
    </View>
  );
}
