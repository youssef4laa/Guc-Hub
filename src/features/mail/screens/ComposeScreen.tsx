import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Button, Text } from "../../../core/ui";
import { ComposeAttachments } from "../components/ComposeAttachments";
import { useDraftAutosave } from "../hooks/useDraftAutosave";
import { createDraft, validateDraft, type DraftProblem } from "../logic/draft";
import type { MailDraft } from "../schema";
import { useSendMessage } from "../store";

export function ComposeScreen({ draftId, onClose }: { draftId: string; onClose: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<MailDraft>(() => createDraft(draftId));
  const [showCcBcc, setShowCcBcc] = useState(false);
  const send = useSendMessage();

  useDraftAutosave(draft);

  const update = (changes: Partial<MailDraft>) =>
    setDraft((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }));

  const validation = useMemo(() => validateDraft(draft), [draft]);
  const [attempted, setAttempted] = useState(false);

  const submit = () => {
    setAttempted(true);
    if (!validation.ok) return;
    send.mutate({ draftId: draft.id, message: validation.message }, { onSuccess: onClose });
  };

  const inputStyle = {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("mail.discard")}
          onPress={onClose}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 36 }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
          <Text color="primary">{t("mail.discard")}</Text>
        </Pressable>
        <Text variant="heading">{t("mail.compose")}</Text>
        <Button label={t("mail.send")} onPress={submit} loading={send.isPending} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          accessibilityLabel={t("mail.to")}
          placeholder={t("mail.to")}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={draft.to}
          onChangeText={(to) => update({ to })}
          style={inputStyle}
        />

        {showCcBcc ? (
          <>
            <TextInput
              accessibilityLabel={t("mail.cc")}
              placeholder={t("mail.cc")}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={draft.cc}
              onChangeText={(cc) => update({ cc })}
              style={inputStyle}
            />
            <TextInput
              accessibilityLabel={t("mail.bcc")}
              placeholder={t("mail.bcc")}
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={draft.bcc}
              onChangeText={(bcc) => update({ bcc })}
              style={inputStyle}
            />
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowCcBcc(true)}
            style={{ paddingVertical: theme.spacing.sm, minHeight: 36 }}
          >
            <Text variant="caption" color="primary">
              {t("mail.addCcBcc")}
            </Text>
          </Pressable>
        )}

        <TextInput
          accessibilityLabel={t("mail.subject")}
          placeholder={t("mail.subject")}
          placeholderTextColor={theme.colors.textMuted}
          value={draft.subject}
          onChangeText={(subject) => update({ subject })}
          style={inputStyle}
        />

        <TextInput
          accessibilityLabel={t("mail.body")}
          placeholder={t("mail.body")}
          placeholderTextColor={theme.colors.textMuted}
          value={draft.text}
          onChangeText={(text) => update({ text })}
          multiline
          textAlignVertical="top"
          style={{
            color: theme.colors.text,
            paddingVertical: theme.spacing.md,
            minHeight: 180,
          }}
        />

        <ComposeAttachments
          attachments={draft.attachments}
          onChange={(attachments) => update({ attachments })}
        />

        {attempted && !validation.ok ? (
          <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.md }}>
            {validation.problems.map((problem, index) => (
              <Text key={index} color="danger" variant="caption">
                {describeProblem(problem, t)}
              </Text>
            ))}
          </View>
        ) : null}

        {send.isError ? (
          <Text color="danger" variant="caption" style={{ marginTop: theme.spacing.md }}>
            {send.error instanceof Error ? send.error.message : t("mail.sendFailed")}
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type TranslateFn = ReturnType<typeof useTranslation>["t"];

function describeProblem(problem: DraftProblem, t: TranslateFn): string {
  switch (problem.code) {
    case "no-recipients":
      return t("mail.errorNoRecipients");
    case "invalid-address":
      return t("mail.errorInvalidAddress", { entries: problem.entries.join(", ") });
    case "attachments-too-large":
      return t("mail.errorAttachmentsTooLarge");
  }
}
