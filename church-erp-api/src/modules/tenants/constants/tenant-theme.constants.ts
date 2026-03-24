export const TENANT_THEME_KEYS = ['green', 'blue', 'gray', 'dark'] as const;

export type TenantThemeKey = (typeof TENANT_THEME_KEYS)[number];

export const DEFAULT_TENANT_THEME_KEY: TenantThemeKey = 'green';
