import {
  DEFAULT_TENANT_THEME_KEY,
  TENANT_THEME_OPTIONS,
  type TenantThemeKey,
} from "@/lib/tenant-branding";

export interface TenantBrandingItem {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  themeKey: TenantThemeKey;
}

export interface UpdateTenantBrandingPayload {
  logoUrl?: string | null;
  themeKey: TenantThemeKey;
}

export interface TenantBrandingFormValues {
  logoUrl: string;
  themeKey: TenantThemeKey;
}

export const ADMIN_TENANT_THEME_OPTIONS = TENANT_THEME_OPTIONS;

export { DEFAULT_TENANT_THEME_KEY };
