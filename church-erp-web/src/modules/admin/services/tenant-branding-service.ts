import { ensureApiConfigured, http } from "@/lib/http";
import {
  normalizeTenantLogoUrl,
  normalizeTenantTheme,
} from "@/lib/tenant-branding";
import type {
  TenantBrandingItem,
  TenantLogoUploadResponse,
  UpdateTenantBrandingPayload,
} from "@/modules/admin/types/tenant-branding";

const TENANT_BRANDING_ENDPOINT = "/tenant/branding";
const TENANT_BRANDING_LOGO_ENDPOINT = "/tenant/branding/logo";

function sanitizePayload(payload: UpdateTenantBrandingPayload) {
  return {
    logoUrl: normalizeTenantLogoUrl(payload.logoUrl),
    themeKey: normalizeTenantTheme(payload.themeKey),
  };
}

export async function getCurrentTenantBranding(): Promise<TenantBrandingItem> {
  ensureApiConfigured();

  const response = await http.get<TenantBrandingItem>(TENANT_BRANDING_ENDPOINT);
  return response.data;
}

export async function updateCurrentTenantBranding(
  payload: UpdateTenantBrandingPayload,
): Promise<TenantBrandingItem> {
  ensureApiConfigured();

  const response = await http.patch<TenantBrandingItem>(
    TENANT_BRANDING_ENDPOINT,
    sanitizePayload(payload),
  );

  return response.data;
}

export async function uploadCurrentTenantLogo(
  file: File,
): Promise<TenantLogoUploadResponse> {
  ensureApiConfigured();

  const formData = new FormData();
  formData.append("logo", file);

  const response = await http.postForm<TenantLogoUploadResponse>(
    TENANT_BRANDING_LOGO_ENDPOINT,
    formData,
  );

  return response.data;
}
