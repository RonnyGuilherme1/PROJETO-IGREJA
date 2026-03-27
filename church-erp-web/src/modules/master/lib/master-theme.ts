import type { CSSProperties } from "react";

export const MASTER_THEME_STORAGE_KEY = "church-erp.master-theme";
export const DEFAULT_MASTER_THEME = "light";

export const MASTER_THEME_OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
] as const;

export type MasterTheme = (typeof MASTER_THEME_OPTIONS)[number]["value"];

type MasterThemeTokens = {
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
  loginGlow: string;
  loginShadow: string;
  loginStart: string;
  loginMid: string;
  loginEnd: string;
  loginTopLine: string;
  loginChipBg: string;
  loginChipBorder: string;
  loginChipShadow: string;
  loginChipTitle: string;
  loginChipSubtitle: string;
  loginChipIconBg: string;
  loginChipIconFg: string;
  loginEyebrow: string;
  loginHeroTitle: string;
  loginHeroBody: string;
  loginCardBg: string;
  loginCardForeground: string;
  loginCardBorder: string;
  loginCardShadow: string;
  loginCardHighlight: string;
  loginCardLine: string;
  loginBadgeBg: string;
  loginBadgeBorder: string;
  loginBadgeText: string;
  loginLabel: string;
  loginInputBg: string;
  loginInputText: string;
  loginInputPlaceholder: string;
  loginInputRing: string;
  loginButtonBg: string;
  loginButtonHover: string;
  loginButtonText: string;
  loginButtonShadow: string;
  loginErrorBg: string;
  loginErrorBorder: string;
  loginErrorText: string;
  loginSuccessBg: string;
  loginSuccessBorder: string;
  loginSuccessText: string;
};

type MasterThemeStyle = CSSProperties &
  Record<`--${string}`, string> & {
    colorScheme: "light" | "dark";
  };

const MASTER_THEME_TOKENS: Record<MasterTheme, MasterThemeTokens> = {
  light: {
    background: "#f7f6f1",
    foreground: "#10261d",
    card: "#ffffff",
    cardForeground: "#10261d",
    popover: "#ffffff",
    popoverForeground: "#10261d",
    primary: "#0f4a36",
    primaryForeground: "#f8fbf9",
    secondary: "#f2ecd8",
    secondaryForeground: "#3f3520",
    muted: "#f6f2e7",
    mutedForeground: "#6f6a5b",
    accent: "#c7a64a",
    accentForeground: "#1f1a10",
    destructive: "#b93831",
    destructiveForeground: "#ffffff",
    border: "#e3dcc8",
    input: "#ddd5c0",
    ring: "#c7a64a",
    sidebar: "#0d3327",
    sidebarForeground: "#eef6f1",
    sidebarAccent: "#124636",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    surfaceBase: "#ffffff",
    surfaceSoft: "rgb(255 255 255 / 0.88)",
    surfaceMuted: "rgb(255 255 255 / 0.76)",
    surfaceStrong: "#ffffff",
    shellGlow: "rgb(15 74 54 / 0.1)",
    shellStart: "#fbfaf6",
    shellEnd: "#f4f0e4",
    loginGlow: "rgba(15,74,54,0.16)",
    loginShadow: "rgba(199,166,74,0.14)",
    loginStart: "#fbfaf6",
    loginMid: "#f7f3e8",
    loginEnd: "#f1ecdd",
    loginTopLine: "rgba(16,38,29,0.06)",
    loginChipBg: "rgba(255,255,255,0.82)",
    loginChipBorder: "rgba(16,38,29,0.08)",
    loginChipShadow: "0 14px 30px rgba(16,38,29,0.08)",
    loginChipTitle: "#10261d",
    loginChipSubtitle: "#6f6a5b",
    loginChipIconBg: "rgba(15,74,54,0.12)",
    loginChipIconFg: "#0f4a36",
    loginEyebrow: "rgba(15,74,54,0.72)",
    loginHeroTitle: "#10261d",
    loginHeroBody: "#5f5a4d",
    loginCardBg: "rgba(255,255,255,0.88)",
    loginCardForeground: "#10261d",
    loginCardBorder: "rgba(16,38,29,0.06)",
    loginCardShadow: "0 22px 60px rgba(16,38,29,0.12)",
    loginCardHighlight: "rgba(16,38,29,0.02)",
    loginCardLine: "rgba(199,166,74,0.18)",
    loginBadgeBg: "rgba(199,166,74,0.1)",
    loginBadgeBorder: "rgba(199,166,74,0.22)",
    loginBadgeText: "#0f4a36",
    loginLabel: "#4a4a42",
    loginInputBg: "#f5f8f5",
    loginInputText: "#10261d",
    loginInputPlaceholder: "#827a68",
    loginInputRing: "rgba(199,166,74,0.32)",
    loginButtonBg: "#0f4a36",
    loginButtonHover: "#0b3c2b",
    loginButtonText: "#f8fbf9",
    loginButtonShadow: "0 10px 22px rgba(15,74,54,0.16)",
    loginErrorBg: "rgba(185,56,49,0.08)",
    loginErrorBorder: "rgba(185,56,49,0.18)",
    loginErrorText: "#8c2f2a",
    loginSuccessBg: "rgba(15,74,54,0.08)",
    loginSuccessBorder: "rgba(15,74,54,0.16)",
    loginSuccessText: "#0f4a36",
  },
  dark: {
    background: "#08110e",
    foreground: "#f4efe0",
    card: "#0d1713",
    cardForeground: "#f4efe0",
    popover: "#0d1713",
    popoverForeground: "#f4efe0",
    primary: "#d6b65f",
    primaryForeground: "#10261d",
    secondary: "#14201b",
    secondaryForeground: "#dfd8c3",
    muted: "#111916",
    mutedForeground: "#9b9688",
    accent: "#d6b65f",
    accentForeground: "#10261d",
    destructive: "#ef6b5f",
    destructiveForeground: "#081014",
    border: "#2f3a2d",
    input: "#17211d",
    ring: "#d6b65f",
    sidebar: "#07100d",
    sidebarForeground: "#f4efe0",
    sidebarAccent: "#13211b",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    surfaceBase: "#0d1713",
    surfaceSoft: "rgb(13 23 19 / 0.88)",
    surfaceMuted: "rgb(17 25 22 / 0.76)",
    surfaceStrong: "#17211d",
    shellGlow: "rgb(214 182 95 / 0.09)",
    shellStart: "#0d1613",
    shellEnd: "#07100d",
    loginGlow: "rgba(15,74,54,0.22)",
    loginShadow: "rgba(214,182,95,0.08)",
    loginStart: "#04110d",
    loginMid: "#071712",
    loginEnd: "#020806",
    loginTopLine: "rgba(255,255,255,0.04)",
    loginChipBg: "rgba(0,0,0,0.2)",
    loginChipBorder: "rgba(255,255,255,0.06)",
    loginChipShadow: "0 14px 30px rgba(0,0,0,0.18)",
    loginChipTitle: "#ffffff",
    loginChipSubtitle: "#d6b65f",
    loginChipIconBg: "rgba(15,63,45,0.2)",
    loginChipIconFg: "#d6b65f",
    loginEyebrow: "rgba(214,182,95,0.86)",
    loginHeroTitle: "#ffffff",
    loginHeroBody: "#c5d4cc",
    loginCardBg: "rgba(13,22,19,0.82)",
    loginCardForeground: "#f8fafc",
    loginCardBorder: "rgba(255,255,255,0.02)",
    loginCardShadow: "0 22px 60px rgba(0,0,0,0.3)",
    loginCardHighlight: "rgba(255,255,255,0.018)",
    loginCardLine: "rgba(214,182,95,0.18)",
    loginBadgeBg: "rgba(199,166,74,0.1)",
    loginBadgeBorder: "rgba(214,182,95,0.2)",
    loginBadgeText: "#f0df9d",
    loginLabel: "#cbd5e1",
    loginInputBg: "#151c1c",
    loginInputText: "#f1f5f9",
    loginInputPlaceholder: "#64748b",
    loginInputRing: "rgba(214,182,95,0.24)",
    loginButtonBg: "#c7a64a",
    loginButtonHover: "#b39239",
    loginButtonText: "#10261d",
    loginButtonShadow: "0 10px 22px rgba(0,0,0,0.12)",
    loginErrorBg: "rgba(244,63,94,0.08)",
    loginErrorBorder: "rgba(244,63,94,0.15)",
    loginErrorText: "#ffe4e6",
    loginSuccessBg: "rgba(15,74,54,0.12)",
    loginSuccessBorder: "rgba(15,74,54,0.2)",
    loginSuccessText: "#d8f0e3",
  },
};

function createMasterThemeStyle(
  theme: MasterTheme,
  tokens: MasterThemeTokens,
): MasterThemeStyle {
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
    "--master-shell-glow": tokens.shellGlow,
    "--master-shell-start": tokens.shellStart,
    "--master-shell-end": tokens.shellEnd,
    "--master-login-glow": tokens.loginGlow,
    "--master-login-shadow": tokens.loginShadow,
    "--master-login-start": tokens.loginStart,
    "--master-login-mid": tokens.loginMid,
    "--master-login-end": tokens.loginEnd,
    "--master-login-top-line": tokens.loginTopLine,
    "--master-login-chip-bg": tokens.loginChipBg,
    "--master-login-chip-border": tokens.loginChipBorder,
    "--master-login-chip-shadow": tokens.loginChipShadow,
    "--master-login-chip-title": tokens.loginChipTitle,
    "--master-login-chip-subtitle": tokens.loginChipSubtitle,
    "--master-login-chip-icon-bg": tokens.loginChipIconBg,
    "--master-login-chip-icon-fg": tokens.loginChipIconFg,
    "--master-login-eyebrow": tokens.loginEyebrow,
    "--master-login-hero-title": tokens.loginHeroTitle,
    "--master-login-hero-body": tokens.loginHeroBody,
    "--master-login-card-bg": tokens.loginCardBg,
    "--master-login-card-foreground": tokens.loginCardForeground,
    "--master-login-card-border": tokens.loginCardBorder,
    "--master-login-card-shadow": tokens.loginCardShadow,
    "--master-login-card-highlight": tokens.loginCardHighlight,
    "--master-login-card-line": tokens.loginCardLine,
    "--master-login-badge-bg": tokens.loginBadgeBg,
    "--master-login-badge-border": tokens.loginBadgeBorder,
    "--master-login-badge-text": tokens.loginBadgeText,
    "--master-login-label": tokens.loginLabel,
    "--master-login-input-bg": tokens.loginInputBg,
    "--master-login-input-text": tokens.loginInputText,
    "--master-login-input-placeholder": tokens.loginInputPlaceholder,
    "--master-login-input-ring": tokens.loginInputRing,
    "--master-login-button-bg": tokens.loginButtonBg,
    "--master-login-button-hover": tokens.loginButtonHover,
    "--master-login-button-text": tokens.loginButtonText,
    "--master-login-button-shadow": tokens.loginButtonShadow,
    "--master-login-error-bg": tokens.loginErrorBg,
    "--master-login-error-border": tokens.loginErrorBorder,
    "--master-login-error-text": tokens.loginErrorText,
    "--master-login-success-bg": tokens.loginSuccessBg,
    "--master-login-success-border": tokens.loginSuccessBorder,
    "--master-login-success-text": tokens.loginSuccessText,
    colorScheme: theme,
  };
}

const MASTER_THEME_STYLES = {
  light: createMasterThemeStyle("light", MASTER_THEME_TOKENS.light),
  dark: createMasterThemeStyle("dark", MASTER_THEME_TOKENS.dark),
} satisfies Record<MasterTheme, MasterThemeStyle>;

export function normalizeMasterTheme(value: unknown): MasterTheme {
  if (typeof value !== "string") {
    return DEFAULT_MASTER_THEME;
  }

  const normalizedValue = value.trim().toLowerCase();

  return MASTER_THEME_OPTIONS.some((option) => option.value === normalizedValue)
    ? (normalizedValue as MasterTheme)
    : DEFAULT_MASTER_THEME;
}

export function getMasterThemeStyle(theme?: MasterTheme | string | null) {
  return MASTER_THEME_STYLES[normalizeMasterTheme(theme)];
}
