import { useCallback, useEffect, useRef, useState } from "react";

import type { UndoToken } from "../provider";
import { useDeleteMessages, useUndoDelete } from "../store";

/** How long the undo bar stays before the delete becomes final in the UI. */
export const UNDO_WINDOW_MS = 6000;

export interface PendingDelete {
  token: UndoToken;
  count: number;
}

/**
 * Delete-then-offer-undo, the pattern the provider was built for. The mock (and
 * a real server later) keeps exactly one undoable delete, so a second delete
 * replaces the first — the bar follows that, rather than implying a stack of
 * undos that doesn't exist.
 */
export function useDeleteWithUndo() {
  const deleteMessages = useDeleteMessages();
  const undoDelete = useUndoDelete();
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const remove = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      clearTimer();
      deleteMessages.mutate(
        { ids },
        {
          onSuccess: (token) => {
            setPending({ token, count: ids.length });
            timer.current = setTimeout(() => setPending(null), UNDO_WINDOW_MS);
          },
          onError: () => setPending(null),
        },
      );
    },
    [deleteMessages],
  );

  const undo = useCallback(() => {
    if (!pending) return;
    clearTimer();
    const { token } = pending;
    setPending(null);
    undoDelete.mutate({ token });
  }, [pending, undoDelete]);

  const dismiss = useCallback(() => {
    clearTimer();
    setPending(null);
  }, []);

  return { remove, undo, dismiss, pending, isUndoing: undoDelete.isPending };
}
