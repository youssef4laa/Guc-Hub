import { useEffect, useState } from "react";
import { Animated, StyleSheet, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

export function Skeleton({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  // A plain state initializer, not useRef — react-hooks/refs flags reading
  // `.current` during render, and this value never needs to trigger a re-render.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { backgroundColor: theme.colors.border, opacity, borderRadius: theme.radii.sm },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { height: 16, width: "100%" },
});
