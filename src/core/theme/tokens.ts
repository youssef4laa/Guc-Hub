export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radii = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, fontWeight: "700" as const },
  heading: { fontSize: 20, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
};

const lightPalette = {
  background: "#FFFFFF",
  surface: "#F5F6F8",
  border: "#E1E3E8",
  text: "#111318",
  textMuted: "#5B616E",
  primary: "#0B5FFF",
  onPrimary: "#FFFFFF",
  success: "#1E9E5A",
  warning: "#B98900",
  danger: "#D0342C",
  overlay: "rgba(0,0,0,0.4)",
};

const darkPalette = {
  background: "#0E1013",
  surface: "#1A1D22",
  border: "#2B2F36",
  text: "#F2F3F5",
  textMuted: "#9AA0AB",
  primary: "#4C8DFF",
  onPrimary: "#0E1013",
  success: "#3FCB84",
  warning: "#E0AE3A",
  danger: "#FF6B62",
  overlay: "rgba(0,0,0,0.6)",
};

export const themes = {
  light: { colors: lightPalette, spacing, radii, typography },
  dark: { colors: darkPalette, spacing, radii, typography },
};

export type ThemeName = keyof typeof themes;
export type Theme = (typeof themes)[ThemeName];
