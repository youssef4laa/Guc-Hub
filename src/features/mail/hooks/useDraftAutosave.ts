import { useEffect, useRef } from "react";

import { saveDraft } from "../cache/draftCache";
import { isDraftEmpty } from "../logic/draft";
import type { MailDraft } from "../schema";

const AUTOSAVE_DELAY_MS = 800;

/**
 * Saves the draft a short while after typing stops, and once more on unmount so
 * a message is never lost by navigating away. An untouched draft is never
 * written, so opening and closing compose leaves nothing behind.
 */
export function useDraftAutosave(draft: MailDraft): void {
  // Kept in a ref so the unmount save below sees the final draft without
  // re-registering that effect on every keystroke. Updated in an effect, never
  // during render.
  const latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
  }, [draft]);

  useEffect(() => {
    if (isDraftEmpty(draft)) return;
    const timer = setTimeout(() => void saveDraft(draft), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    return () => {
      if (!isDraftEmpty(latest.current)) void saveDraft(latest.current);
    };
  }, []);
}
