// Imported directly rather than through core/ui's barrel: the barrel also pulls in
// WebViewScreen, whose native module isn't available to unit tests.
import { useResponsiveLayout } from "../../../core/ui/useResponsiveLayout";

export interface MailLayout {
  /** List and reader side by side (tablets); otherwise one at a time. */
  twoPane: boolean;
  listPaneWidth: number;
}

/** Pure, so the breakpoint behaviour is testable without rendering. */
export function mailLayoutFor(width: number, isTablet: boolean): MailLayout {
  return {
    twoPane: isTablet,
    listPaneWidth: Math.max(300, Math.min(400, Math.round(width * 0.38))),
  };
}

export function useMailLayout(): MailLayout {
  const { isTablet, width } = useResponsiveLayout();
  return mailLayoutFor(width, isTablet);
}
