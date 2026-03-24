import { ensureApiConfigured, http } from "@/lib/http";
import {
  normalizeTenantLogoUrl,
  normalizeTenantTheme,
} from "@/lib/tenant-branding";
import type {
  CreateMasterTenantPayload,
  MasterTenantItem,
  MasterTenantsListResult,
  UpdateMasterTenantPayload,
} from "@/modules/master/types/tenant";

const MASTER_TENANTS_ENDPOINT = "/master/tenants";

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

export async function activateMasterTenant(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${MASTER_TENANTS_ENDPOINT}/${id}/activate`);
}

export async function inactivateMasterTenant(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${MASTER_TENANTS_ENDPOINT}/${id}/inactivate`);
}
