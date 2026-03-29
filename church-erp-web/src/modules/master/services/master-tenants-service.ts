import { ensureApiConfigured, http } from "@/lib/http";
import {
  normalizeTenantLogoUrl,
  normalizeTenantTheme,
} from "@/lib/tenant-branding";
import type {
  CreateMasterTenantPayload,
  GenerateMasterTenantWhatsappOnboardingLinkPayload,
  MasterTenantItem,
  MasterTenantWhatsappIntegrationStatus,
  MasterTenantWhatsappOnboardingLinkResult,
  MasterTenantsListResult,
  UpdateMasterTenantPayload,
} from "@/modules/master/types/tenant";

const MASTER_TENANTS_ENDPOINT = "/master/tenants";

interface MasterTenantLogoUploadResponse {
  logoUrl: string;
}

function normalizeOptionalString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeWhatsappIntegrationStatus(
  integration: MasterTenantWhatsappIntegrationStatus,
): MasterTenantWhatsappIntegrationStatus {
  return {
    ...integration,
    requestedPhoneNumber: normalizeOptionalString(integration.requestedPhoneNumber),
    connectedPhoneDisplay: normalizeOptionalString(
      integration.connectedPhoneDisplay,
    ),
    businessAccountId: normalizeOptionalString(integration.businessAccountId),
    phoneNumberId: normalizeOptionalString(integration.phoneNumberId),
    onboardingState: normalizeOptionalString(integration.onboardingState),
    lastConnectedAt: normalizeOptionalString(integration.lastConnectedAt),
    lastErrorMessage: normalizeOptionalString(integration.lastErrorMessage),
    updatedAt: normalizeOptionalString(integration.updatedAt),
  };
}

function sanitizeCreatePayload(payload: CreateMasterTenantPayload) {
  return {
    name: payload.name.trim(),
    status: payload.status,
    logoUrl: normalizeTenantLogoUrl(payload.logoUrl),
    themeKey: normalizeTenantTheme(payload.themeKey),
    adminUser: {
      name: payload.adminName.trim(),
      username: payload.adminUsername.trim().toLowerCase(),
      email: payload.adminEmail?.trim().toLowerCase() || null,
      password: payload.adminPassword,
    },
  };
}

function sanitizeUpdatePayload(payload: UpdateMasterTenantPayload) {
  const sanitizedPayload = {
    name: payload.name?.trim(),
    code:
      "code" in payload && payload.code !== undefined
        ? payload.code.trim()
        : undefined,
    status: payload.status,
    logoUrl:
      "logoUrl" in payload && payload.logoUrl !== undefined
        ? normalizeTenantLogoUrl(payload.logoUrl)
        : undefined,
    themeKey:
      "themeKey" in payload && payload.themeKey !== undefined
        ? normalizeTenantTheme(payload.themeKey)
        : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listMasterTenants(): Promise<MasterTenantsListResult> {
  ensureApiConfigured();

  const response = await http.get<MasterTenantItem[]>(MASTER_TENANTS_ENDPOINT);

  return {
    items: response.data,
    total: response.data.length,
  };
}

export async function getMasterTenantById(id: string): Promise<MasterTenantItem> {
  ensureApiConfigured();

  const response = await http.get<MasterTenantItem>(
    `${MASTER_TENANTS_ENDPOINT}/${id}`,
  );

  return response.data;
}

export async function createMasterTenant(
  payload: CreateMasterTenantPayload,
): Promise<MasterTenantItem> {
  ensureApiConfigured();

  const response = await http.post<MasterTenantItem>(
    MASTER_TENANTS_ENDPOINT,
    sanitizeCreatePayload(payload),
  );

  return response.data;
}

export async function updateMasterTenant(
  id: string,
  payload: UpdateMasterTenantPayload,
): Promise<MasterTenantItem> {
  ensureApiConfigured();

  const response = await http.patch<MasterTenantItem>(
    `${MASTER_TENANTS_ENDPOINT}/${id}`,
    sanitizeUpdatePayload(payload),
  );

  return response.data;
}

export async function uploadMasterTenantLogo(
  id: string,
  file: File,
): Promise<string> {
  ensureApiConfigured();

  const formData = new FormData();
  formData.append("logo", file);

  const response = await http.post<MasterTenantLogoUploadResponse>(
    `${MASTER_TENANTS_ENDPOINT}/${id}/logo`,
    formData,
  );

  const logoUrl = normalizeTenantLogoUrl(response.data.logoUrl);

  if (!logoUrl) {
    throw new Error("Nao foi possivel obter a URL da logo enviada.");
  }

  return logoUrl;
}

export async function activateMasterTenant(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${MASTER_TENANTS_ENDPOINT}/${id}/activate`);
}

export async function inactivateMasterTenant(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${MASTER_TENANTS_ENDPOINT}/${id}/inactivate`);
}

export async function getMasterTenantWhatsappIntegrationStatus(
  id: string,
): Promise<MasterTenantWhatsappIntegrationStatus> {
  ensureApiConfigured();

  const response = await http.get<MasterTenantWhatsappIntegrationStatus>(
    `${MASTER_TENANTS_ENDPOINT}/${id}/whatsapp`,
  );

  return normalizeWhatsappIntegrationStatus(response.data);
}

export async function generateMasterTenantWhatsappOnboardingLink(
  id: string,
  payload: GenerateMasterTenantWhatsappOnboardingLinkPayload,
): Promise<MasterTenantWhatsappOnboardingLinkResult> {
  ensureApiConfigured();

  const response = await http.post<MasterTenantWhatsappOnboardingLinkResult>(
    `${MASTER_TENANTS_ENDPOINT}/${id}/whatsapp/onboarding-link`,
    {
      requestedPhoneNumber: payload.requestedPhoneNumber.trim(),
    },
  );

  const normalizedIntegration = normalizeWhatsappIntegrationStatus(response.data);
  const onboardingLink = normalizeOptionalString(response.data.onboardingLink);

  if (!onboardingLink) {
    throw new Error(
      "O backend nao retornou um link publico valido para o onboarding do WhatsApp.",
    );
  }

  return {
    ...normalizedIntegration,
    onboardingLink,
  };
}
