import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

import { getItem, setItem } from "../storage/kv";
import { themes, type Theme, type ThemeName } from "./tokens";

export type ThemePreference = "system" | ThemeName;
const PREFERENCE_KEY = "theme-preference";

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    getItem<ThemePreference>(PREFERENCE_KEY).then((stored) => {
      if (stored) setPreferenceState(stored);
    });
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void setItem(PREFERENCE_KEY, next);
  };

  const themeName: ThemeName =
    preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeName], themeName, preference, setPreference }),
    [themeName, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
