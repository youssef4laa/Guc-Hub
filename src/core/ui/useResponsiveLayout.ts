import { useWindowDimensions } from "react-native";

const TABLET_BREAKPOINT = 768;

/**
 * The one place "is this a tablet-ish width" is decided. Phase 0/1 features
 * (schedule) already branch on it; later features opt in the same way instead of
 * each inventing their own breakpoint.
 */
export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  return { isTablet, width };
}
