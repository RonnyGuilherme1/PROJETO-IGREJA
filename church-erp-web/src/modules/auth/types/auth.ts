import type { TenantThemeKey } from "@/lib/tenant-branding";

export type AuthMode = "TENANT" | "MASTER";

export interface AuthUser {
  name: string;
  email: string;
  profile: string;
  username?: string;
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
  tenantLogoUrl?: string | null;
  tenantThemeKey?: TenantThemeKey;
  authMode?: AuthMode;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  user: AuthUser;
}

export interface AuthSessionMeta {
  tokenType: string;
  expiresIn?: number;
  user: AuthUser;
}
