import type { TenantThemeKey } from "@/lib/tenant-branding";

export type UserRole = "ADMIN" | "SECRETARIA" | "TESOUREIRO" | "CONSULTA";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type PlatformRole =
  | "PLATFORM_ADMIN"
  | "PLATFORM_OPERATOR"
  | "PLATFORM_SUPPORT";

export type AuthAccessType = "PLATFORM" | "TENANT";
export type AuthMode = "TENANT" | "MASTER";

export interface AuthUserTenant {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  themeKey: TenantThemeKey;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  tenantId: string | null;
  platformRole: PlatformRole | null;
  accessType: AuthAccessType;
  churchId: string | null;
  createdAt: string;
  updatedAt: string;
  tenantCode: string | null;
  tenantName: string | null;
  tenantLogoUrl: string | null;
  tenantThemeKey: TenantThemeKey | null;
  tenant: AuthUserTenant | null;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface AuthSessionMeta {
  user: AuthUser;
}
