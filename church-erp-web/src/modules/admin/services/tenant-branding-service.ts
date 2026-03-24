import { ensureApiConfigured, http } from "@/lib/http";
import {
  normalizeTenantLogoUrl,
  normalizeTenantTheme,
} from "@/lib/tenant-branding";
import type {
  TenantBrandingItem,
  UpdateTenantBrandingPayload,
} from "@/modules/admin/types/tenant-branding";

type JsonRecord = Record<string, unknown>;

const TENANT_BRANDING_ENDPOINT = "/tenant/branding";

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValueByPath(source: unknown, path: string[]) {
  let current = source;

  for (const key of path) {
    if (!isRecord(current) || !(key in current)) {
      return null;
    }

    current = current[key];
  }

  return current;
}

function findFirstValue(source: unknown, paths: string[][]) {
  for (const path of paths) {
    const value = getValueByPath(source, path);

    if (value !== null && value !== undefined) {
      return value;
    }
  }

  return null;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function extractSingleRecord(data: unknown): unknown {
  if (isRecord(data)) {
    const nestedCandidates = [
      ["data"],
      ["item"],
      ["tenant"],
      ["branding"],
      ["result"],
      ["payload"],
    ];

    for (const path of nestedCandidates) {
      const candidate = getValueByPath(data, path);

      if (isRecord(candidate)) {
        return candidate;
      }
    }
  }

  return data;
}

function normalizeTenantBranding(source: unknown): TenantBrandingItem {
  return {
    id:
      toTrimmedString(
        findFirstValue(source, [["id"], ["tenantId"], ["tenant_id"]]),
      ) ?? "",
    name:
      toTrimmedString(
        findFirstValue(source, [["name"], ["tenantName"], ["displayName"]]),
      ) ?? "",
    code:
      toTrimmedString(
        findFirstValue(source, [["code"], ["tenantCode"], ["slug"]]),
      ) ?? "",
    logoUrl: normalizeTenantLogoUrl(
      findFirstValue(source, [
        ["logoUrl"],
        ["logo_url"],
        ["tenantLogoUrl"],
        ["branding", "logoUrl"],
      ]),
    ),
    themeKey: normalizeTenantTheme(
      findFirstValue(source, [
        ["themeKey"],
        ["theme_key"],
        ["tenantThemeKey"],
        ["branding", "themeKey"],
      ]),
    ),
  };
}

function sanitizePayload(payload: UpdateTenantBrandingPayload) {
  return {
    logoUrl: normalizeTenantLogoUrl(payload.logoUrl),
    themeKey: normalizeTenantTheme(payload.themeKey),
  };
}

export async function getCurrentTenantBranding(): Promise<TenantBrandingItem> {
  ensureApiConfigured();

  const response = await http.get(TENANT_BRANDING_ENDPOINT);

  return normalizeTenantBranding(extractSingleRecord(response.data));
}

export async function updateCurrentTenantBranding(
  payload: UpdateTenantBrandingPayload,
): Promise<TenantBrandingItem> {
  ensureApiConfigured();

  const response = await http.patch(
    TENANT_BRANDING_ENDPOINT,
    sanitizePayload(payload),
  );

  return normalizeTenantBranding(extractSingleRecord(response.data));
}
