import { redactString, redactValue } from "./redact";

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: Level = __DEV__ ? "debug" : "info";

function emit(level: Level, scope: string, message: string, extra?: unknown) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;
  const safeExtra = extra === undefined ? undefined : redactValue(extra);
  const line = `[${scope}] ${redactString(message)}`;
  console[level === "debug" ? "log" : level](line, safeExtra ?? "");
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, extra?: unknown) => emit("debug", scope, message, extra),
    info: (message: string, extra?: unknown) => emit("info", scope, message, extra),
    warn: (message: string, extra?: unknown) => emit("warn", scope, message, extra),
    error: (message: string, extra?: unknown) => emit("error", scope, message, extra),
  };
}

export type Logger = ReturnType<typeof createLogger>;
