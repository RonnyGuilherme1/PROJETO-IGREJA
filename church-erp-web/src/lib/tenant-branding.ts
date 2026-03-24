import type { CSSProperties } from "react";

export const TENANT_THEME_OPTIONS = [
  { value: "green", label: "Verde" },
  { value: "blue", label: "Azul" },
  { value: "gray", label: "Grafite" },
  { value: "dark", label: "Escuro" },
] as const;

export type TenantThemeKey = (typeof TENANT_THEME_OPTIONS)[number]["value"];

export const DEFAULT_TENANT_THEME_KEY: TenantThemeKey = "green";

type TenantThemeTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarAccent: string;
  sidebarBorder: string;
  surfaceBase: string;
  surfaceSoft: string;
  surfaceMuted: string;
  surfaceStrong: string;
  shellGlow: string;
  shellStart: string;
  shellEnd: string;
};

const TENANT_THEME_TOKENS: Record<TenantThemeKey, TenantThemeTokens> = {
  green: {
    background: "#f4f6f1",
    foreground: "#17211d",
    card: "#ffffff",
    cardForeground: "#17211d",
    popover: "#ffffff",
    popoverForeground: "#17211d",
    primary: "#1f5b49",
    primaryForeground: "#f8fbf9",
    secondary: "#e7ede8",
    secondaryForeground: "#173126",
    muted: "#edf2ee",
    mutedForeground: "#65716c",
    accent: "#dfe9e2",
    accentForeground: "#183127",
    destructive: "#b93831",
    destructiveForeground: "#ffffff",
    border: "#d7ded8",
    input: "#d7ded8",
    ring: "#1f5b49",
    sidebar: "#17362d",
    sidebarForeground: "#eef5f1",
    sidebarAccent: "#24483c",
    sidebarBorder: "rgba(255, 255, 255, 0.1)",
    surfaceBase: "#ffffff",
    surfaceSoft: "rgb(255 255 255 / 0.86)",
    surfaceMuted: "rgb(255 255 255 / 0.72)",
    surfaceStrong: "#ffffff",
    shellGlow: "rgb(31 91 73 / 0.12)",
    shellStart: "#fbfcfa",
    shellEnd: "#f3f5f1",
  },
  blue: {
    background: "#f3f7fc",
    foreground: "#142235",
    card: "#ffffff",
    cardForeground: "#142235",
    popover: "#ffffff",
    popoverForeground: "#142235",
    primary: "#1f4f7d",
    primaryForeground: "#f5f9ff",
    secondary: "#e6eef7",
    secondaryForeground: "#17314d",
    muted: "#edf3f8",
    mutedForeground: "#637288",
    accent: "#dce8f4",
    accentForeground: "#17314d",
    destructive: "#c2410c",
    destructiveForeground: "#ffffff",
    border: "#d7e0ea",
    input: "#d7e0ea",
    ring: "#1f4f7d",
    sidebar: "#12304d",
    sidebarForeground: "#edf4fc",
    sidebarAccent: "#1d456d",
    sidebarBorder: "rgba(255, 255, 255, 0.1)",
    surfaceBase: "#ffffff",
    surfaceSoft: "rgb(255 255 255 / 0.86)",
    surfaceMuted: "rgb(255 255 255 / 0.72)",
    surfaceStrong: "#ffffff",
    shellGlow: "rgb(31 79 125 / 0.14)",
    shellStart: "#f9fbff",
    shellEnd: "#edf3f8",
  },
  gray: {
    background: "#f5f5f6",
    foreground: "#1f2328",
    card: "#ffffff",
    cardForeground: "#1f2328",
    popover: "#ffffff",
    popoverForeground: "#1f2328",
    primary: "#4b5563",
    primaryForeground: "#f8fafc",
    secondary: "#eceff1",
    secondaryForeground: "#344054",
    muted: "#f1f3f5",
    mutedForeground: "#667085",
    accent: "#e5e7eb",
    accentForeground: "#344054",
    destructive: "#c2410c",
    destructiveForeground: "#ffffff",
    border: "#d5d9e0",
    input: "#d5d9e0",
    ring: "#4b5563",
    sidebar: "#2a313b",
    sidebarForeground: "#f3f5f7",
    sidebarAccent: "#39424e",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    surfaceBase: "#ffffff",
    surfaceSoft: "rgb(255 255 255 / 0.86)",
    surfaceMuted: "rgb(255 255 255 / 0.72)",
    surfaceStrong: "#ffffff",
    shellGlow: "rgb(75 85 99 / 0.14)",
    shellStart: "#fafafb",
    shellEnd: "#eff1f3",
  },
  dark: {
    background: "#0c1115",
    foreground: "#edf2f7",
    card: "#131a20",
    cardForeground: "#edf2f7",
    popover: "#131a20",
    popoverForeground: "#edf2f7",
    primary: "#4ed08a",
    primaryForeground: "#072314",
    secondary: "#192128",
    secondaryForeground: "#d7e2e8",
    muted: "#161d23",
    mutedForeground: "#94a6b3",
    accent: "#1f2a32",
    accentForeground: "#edf2f7",
    destructive: "#ef6b5f",
    destructiveForeground: "#081014",
    border: "#2a3740",
    input: "#182127",
    ring: "#4ed08a",
    sidebar: "#090d11",
    sidebarForeground: "#f4f7fa",
    sidebarAccent: "#141d24",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    surfaceBase: "#131a20",
    surfaceSoft: "rgb(19 26 32 / 0.88)",
    surfaceMuted: "rgb(22 29 35 / 0.76)",
    surfaceStrong: "#182127",
    shellGlow: "rgb(78 208 138 / 0.08)",
    shellStart: "#10161b",
    shellEnd: "#090d11",
  },
};

type TenantThemeStyle = CSSProperties & Record<`--${string}`, string>;

export function normalizeTenantTheme(value: unknown): TenantThemeKey {
  if (typeof value !== "string") {
    return DEFAULT_TENANT_THEME_KEY;
  }

  const normalizedValue = value.trim().toLowerCase();

  return TENANT_THEME_OPTIONS.some((option) => option.value === normalizedValue)
    ? (normalizedValue as TenantThemeKey)
    : DEFAULT_TENANT_THEME_KEY;
}

export function normalizeTenantLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function getTenantThemeLabel(themeKey?: TenantThemeKey | string | null) {
  const normalizedTheme = normalizeTenantTheme(themeKey);

  return (
    TENANT_THEME_OPTIONS.find((option) => option.value === normalizedTheme)?.label ??
    "Verde"
  );
}

export function getTenantLabel(name?: string | null, code?: string | null) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedCode = typeof code === "string" ? code.trim() : "";

  if (normalizedName && normalizedCode) {
    return `${normalizedName} (${normalizedCode})`;
  }

  if (normalizedName) {
    return normalizedName;
  }

  if (normalizedCode) {
    return `Ambiente ${normalizedCode}`;
  }

  return null;
}

export function getTenantThemeStyle(themeKey?: TenantThemeKey | string | null) {
  const normalizedTheme = normalizeTenantTheme(themeKey);
  const tokens = TENANT_THEME_TOKENS[normalizedTheme];

  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--card": tokens.card,
    "--card-foreground": tokens.cardForeground,
    "--popover": tokens.popover,
    "--popover-foreground": tokens.popoverForeground,
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens.secondaryForeground,
    "--muted": tokens.muted,
    "--muted-foreground": tokens.mutedForeground,
    "--accent": tokens.accent,
    "--accent-foreground": tokens.accentForeground,
    "--destructive": tokens.destructive,
    "--destructive-foreground": tokens.destructiveForeground,
    "--border": tokens.border,
    "--input": tokens.input,
    "--ring": tokens.ring,
    "--sidebar": tokens.sidebar,
    "--sidebar-foreground": tokens.sidebarForeground,
    "--sidebar-accent": tokens.sidebarAccent,
    "--sidebar-border": tokens.sidebarBorder,
    "--surface-base": tokens.surfaceBase,
    "--surface-soft": tokens.surfaceSoft,
    "--surface-muted": tokens.surfaceMuted,
    "--surface-strong": tokens.surfaceStrong,
    "--tenant-shell-glow": tokens.shellGlow,
    "--tenant-shell-start": tokens.shellStart,
    "--tenant-shell-end": tokens.shellEnd,
    colorScheme: normalizedTheme === "dark" ? "dark" : "light",
  } as TenantThemeStyle;
}
