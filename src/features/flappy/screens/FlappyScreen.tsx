import { useCallback, useEffect, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";

import { getItem, setItem } from "../../../core/storage/kv";
import { useTheme } from "../../../core/theme";
import { Screen, Text } from "../../../core/ui";
import { flap, initialState, makeConfig, step, type Config, type GameState } from "../game";

const BEST_KEY = "glide.best";
const MAX_DT = 1 / 30; // clamp long frames so a hiccup never teleports the bird

function Game({ cfg }: { cfg: Config }) {
  const { theme } = useTheme();
  const [state, setState] = useState<GameState>(() => initialState(cfg));
  const [storedBest, setStoredBest] = useState(0);
  const best = Math.max(storedBest, state.score);

  useEffect(() => {
    void getItem<number>(BEST_KEY).then(
      (stored) => stored && setStoredBest((prev) => Math.max(prev, stored)),
    );
  }, []);

  useEffect(() => {
    let frame: number;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, MAX_DT);
      last = now;
      // step() returns the same object unless the run is in progress, so idle frames don't re-render.
      setState((current) => step(current, dt, cfg, Math.random));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cfg]);

  useEffect(() => {
    if (state.status === "over") void setItem(BEST_KEY, best);
    // Persist once per finished run; `best` is derived from the same score.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const onPress = useCallback(() => {
    if (state.status === "over") {
      setStoredBest(best);
      setState(initialState(cfg));
    } else {
      setState((s) => flap(s, cfg));
    }
  }, [best, cfg, state.status]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        state.status === "over"
          ? `Game over. Score ${state.score}. Best ${best}. Tap to play again.`
          : `Glide. Score ${state.score}. Tap to flap.`
      }
      style={{
        width: cfg.width,
        height: cfg.height,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radii.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {state.pipes.map((pipe, i) => (
        <View key={i}>
          <View
            style={{
              position: "absolute",
              left: pipe.x,
              top: 0,
              width: cfg.pipeWidth,
              height: pipe.gapTop,
              backgroundColor: theme.colors.success,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: pipe.x,
              top: pipe.gapTop + cfg.gap,
              width: cfg.pipeWidth,
              height: cfg.height - pipe.gapTop - cfg.gap,
              backgroundColor: theme.colors.success,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
        </View>
      ))}

      <View
        style={{
          position: "absolute",
          left: cfg.birdX,
          top: state.y,
          width: cfg.birdSize,
          height: cfg.birdSize,
          borderRadius: cfg.birdSize / 2,
          backgroundColor: theme.colors.primary,
          transform: [{ rotate: `${Math.max(-25, Math.min(60, state.vy / 8))}deg` }],
        }}
      />

      <View style={{ position: "absolute", top: theme.spacing.lg, left: 0, right: 0, alignItems: "center" }}>
        <Text variant="title">{state.score}</Text>
        <Text variant="caption" color="muted">
          Best {best}
        </Text>
      </View>

      {state.status !== "playing" ? (
        <View
          style={{
            position: "absolute",
            bottom: theme.spacing.xxl,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Text variant="heading">{state.status === "over" ? "Game over" : "Glide"}</Text>
          <Text color="muted">{state.status === "over" ? "Tap to play again" : "Tap to start"}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function FlappyScreen() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const cfg = size ? makeConfig(size.width, size.height) : null;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <Screen>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {size && cfg ? <Game key={`${size.width}x${size.height}`} cfg={cfg} /> : null}
      </View>
    </Screen>
  );
}
