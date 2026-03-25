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
    loginGlow: "rgba(31,91,73,0.14)",
    loginShadow: "rgba(191,203,196,0.26)",
    loginStart: "#f9fbf8",
    loginMid: "#f2f6f2",
    loginEnd: "#ecf2ed",
    loginTopLine: "rgba(23,33,29,0.06)",
    loginChipBg: "rgba(255,255,255,0.82)",
    loginChipBorder: "rgba(23,33,29,0.08)",
    loginChipShadow: "0 14px 30px rgba(23,33,29,0.08)",
    loginChipTitle: "#17211d",
    loginChipSubtitle: "#65716c",
    loginChipIconBg: "rgba(31,91,73,0.12)",
    loginChipIconFg: "#1f5b49",
    loginEyebrow: "rgba(31,91,73,0.72)",
    loginHeroTitle: "#17211d",
    loginHeroBody: "#596660",
    loginCardBg: "rgba(255,255,255,0.88)",
    loginCardForeground: "#17211d",
    loginCardBorder: "rgba(23,33,29,0.06)",
    loginCardShadow: "0 22px 60px rgba(23,33,29,0.12)",
    loginCardHighlight: "rgba(23,33,29,0.02)",
    loginCardLine: "rgba(31,91,73,0.08)",
    loginBadgeBg: "rgba(31,91,73,0.08)",
    loginBadgeBorder: "rgba(31,91,73,0.14)",
    loginBadgeText: "#1f5b49",
    loginLabel: "#415049",
    loginInputBg: "#f5f8f5",
    loginInputText: "#17211d",
    loginInputPlaceholder: "#78857f",
    loginInputRing: "rgba(31,91,73,0.26)",
    loginButtonBg: "#1f5b49",
    loginButtonHover: "#184b3d",
    loginButtonText: "#f8fbf9",
    loginButtonShadow: "0 10px 22px rgba(31,91,73,0.12)",
    loginErrorBg: "rgba(185,56,49,0.08)",
    loginErrorBorder: "rgba(185,56,49,0.18)",
    loginErrorText: "#8c2f2a",
    loginSuccessBg: "rgba(31,91,73,0.08)",
    loginSuccessBorder: "rgba(31,91,73,0.16)",
    loginSuccessText: "#1f5b49",
  },
  dark: {
    background: "#0a1311",
    foreground: "#edf6f2",
    card: "#101816",
    cardForeground: "#edf6f2",
    popover: "#101816",
    popoverForeground: "#edf6f2",
    primary: "#4ed08a",
    primaryForeground: "#072314",
    secondary: "#15211d",
    secondaryForeground: "#d9e6df",
    muted: "#131d1a",
    mutedForeground: "#95a7a0",
    accent: "#1b2824",
    accentForeground: "#edf6f2",
    destructive: "#ef6b5f",
    destructiveForeground: "#081014",
    border: "#25352f",
    input: "#1a2723",
    ring: "#4ed08a",
    sidebar: "#08100e",
    sidebarForeground: "#f4f7fa",
    sidebarAccent: "#12201c",
    sidebarBorder: "rgba(255, 255, 255, 0.08)",
    surfaceBase: "#101816",
    surfaceSoft: "rgb(16 24 22 / 0.88)",
    surfaceMuted: "rgb(19 29 26 / 0.76)",
    surfaceStrong: "#151f1d",
    shellGlow: "rgb(78 208 138 / 0.1)",
    shellStart: "#0f1715",
    shellEnd: "#08100e",
    loginGlow: "rgba(31,91,73,0.18)",
    loginShadow: "rgba(7,17,15,0.72)",
    loginStart: "#050816",
    loginMid: "#08110f",
    loginEnd: "#050816",
    loginTopLine: "rgba(255,255,255,0.04)",
    loginChipBg: "rgba(0,0,0,0.15)",
    loginChipBorder: "rgba(255,255,255,0.04)",
    loginChipShadow: "0 14px 30px rgba(0,0,0,0.16)",
    loginChipTitle: "#ffffff",
    loginChipSubtitle: "#64748b",
    loginChipIconBg: "rgba(52,211,153,0.1)",
    loginChipIconFg: "#d1fae5",
    loginEyebrow: "rgba(110,231,183,0.7)",
    loginHeroTitle: "#ffffff",
    loginHeroBody: "#94a3b8",
    loginCardBg: "rgba(16,23,22,0.8)",
    loginCardForeground: "#f8fafc",
    loginCardBorder: "rgba(255,255,255,0.02)",
    loginCardShadow: "0 22px 60px rgba(0,0,0,0.28)",
    loginCardHighlight: "rgba(255,255,255,0.018)",
    loginCardLine: "rgba(52,211,153,0.05)",
    loginBadgeBg: "rgba(16,185,129,0.08)",
    loginBadgeBorder: "rgba(52,211,153,0.12)",
    loginBadgeText: "#d1fae5",
    loginLabel: "#cbd5e1",
    loginInputBg: "#151c1c",
    loginInputText: "#f1f5f9",
    loginInputPlaceholder: "#64748b",
    loginInputRing: "rgba(16,185,129,0.2)",
    loginButtonBg: "#2b3232",
    loginButtonHover: "#353d3d",
    loginButtonText: "#f1f5f9",
    loginButtonShadow: "0 10px 22px rgba(0,0,0,0.12)",
    loginErrorBg: "rgba(244,63,94,0.08)",
    loginErrorBorder: "rgba(244,63,94,0.15)",
    loginErrorText: "#ffe4e6",
    loginSuccessBg: "rgba(16,185,129,0.08)",
    loginSuccessBorder: "rgba(16,185,129,0.15)",
    loginSuccessText: "#d1fae5",
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
