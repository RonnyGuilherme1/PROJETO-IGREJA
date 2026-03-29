import {
  DEFAULT_TENANT_THEME_KEY,
  TENANT_THEME_OPTIONS,
  type TenantThemeKey,
} from "@/lib/tenant-branding";

export type MasterTenantStatus = "ACTIVE" | "INACTIVE";
export type MasterTenantWhatsappConnectionStatus =
  | "NOT_CONFIGURED"
  | "PENDING_AUTHORIZATION"
  | "CONNECTED"
  | "ERROR";

export interface MasterTenantItem {
  id: string;
  name: string;
  code: string;
  status: MasterTenantStatus;
  logoUrl: string | null;
  themeKey: TenantThemeKey;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterTenantsListResult {
  items: MasterTenantItem[];
  total: number;
}

export interface MasterTenantWhatsappIntegrationStatus {
  tenantId: string;
  provider: "WHATSAPP_CLOUD_API";
  connectionStatus: MasterTenantWhatsappConnectionStatus;
  requestedPhoneNumber: string | null;
  connectedPhoneDisplay: string | null;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  onboardingState: string | null;
  lastConnectedAt: string | null;
  lastErrorMessage: string | null;
  updatedAt: string | null;
}

export interface MasterTenantWhatsappOnboardingLinkResult
  extends MasterTenantWhatsappIntegrationStatus {
  onboardingLink: string;
}

export interface GenerateMasterTenantWhatsappOnboardingLinkPayload {
  requestedPhoneNumber: string;
}

export interface CreateMasterTenantPayload {
  name: string;
  status: MasterTenantStatus;
  logoUrl?: string | null;
  themeKey: TenantThemeKey;
  adminName: string;
  adminUsername: string;
  adminEmail?: string | null;
  adminPassword: string;
}

export interface UpdateMasterTenantPayload {
  name?: string;
  code?: string;
  status?: MasterTenantStatus;
  logoUrl?: string | null;
  themeKey?: TenantThemeKey;
}

export interface MasterTenantFormValues {
  name: string;
  code: string;
  status: MasterTenantStatus;
  logoUrl: string;
  themeKey: TenantThemeKey;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export const MASTER_TENANT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const MASTER_TENANT_THEME_OPTIONS = TENANT_THEME_OPTIONS;

export { DEFAULT_TENANT_THEME_KEY };
