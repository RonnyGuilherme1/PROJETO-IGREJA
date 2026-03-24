import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import {
  normalizeTenantLogoUrl,
  normalizeTenantTheme,
} from "@/lib/tenant-branding";
import type {
  CreateMasterTenantPayload,
  MasterTenantFilters,
  MasterTenantItem,
  MasterTenantsListResult,
  UpdateMasterTenantPayload,
} from "@/modules/master/types/tenant";

type JsonRecord = Record<string, unknown>;

const TENANTS_ENDPOINTS = [
  "/master/tenants",
  "/platform/tenants",
  "/tenants",
];

const DEFAULT_LIST_PARAMS = {
  page: 0,
  size: 5000,
  limit: 5000,
  perPage: 5000,
};

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

function toDateInputValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    const rawValue = value.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
      return rawValue.slice(0, 10);
    }

    const parsed = new Date(rawValue);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return "";
}

function normalizeStatus(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "ACTIVE" : "INACTIVE";
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toUpperCase();

    if (normalized === "ATIVO") {
      return "ACTIVE";
    }

    if (normalized === "INATIVO") {
      return "INACTIVE";
    }

    return normalized;
  }

  return "ACTIVE";
}

function normalizeMasterTenant(source: unknown): MasterTenantItem {
  const id =
    toTrimmedString(
      findFirstValue(source, [["id"], ["uuid"], ["tenantId"], ["tenant_id"]]),
    ) ?? "";

  return {
    id,
    name:
      toTrimmedString(
        findFirstValue(source, [["name"], ["displayName"], ["nome"]]),
      ) ?? "Banco sem nome",
    code:
      toTrimmedString(
        findFirstValue(source, [["tenantCode"], ["code"], ["slug"], ["identifier"]]),
      ) ?? "",
    status: normalizeStatus(
      findFirstValue(source, [["status"], ["active"], ["enabled"]]),
    ),
    logoUrl: normalizeTenantLogoUrl(
      findFirstValue(source, [
        ["logoUrl"],
        ["logo_url"],
        ["tenantLogoUrl"],
        ["tenant", "logoUrl"],
        ["branding", "logoUrl"],
      ]),
    ),
    themeKey: normalizeTenantTheme(
      findFirstValue(source, [
        ["themeKey"],
        ["theme_key"],
        ["theme"],
        ["tenantThemeKey"],
        ["tenant", "themeKey"],
        ["branding", "themeKey"],
      ]),
    ),
    adminName:
      toTrimmedString(
        findFirstValue(source, [
          ["adminName"],
          ["admin", "name"],
          ["adminUser", "name"],
          ["owner", "name"],
        ]),
      ) ?? "",
    adminUsername:
      toTrimmedString(
        findFirstValue(source, [
          ["adminUsername"],
          ["admin", "username"],
          ["adminUser", "username"],
          ["owner", "username"],
          ["admin", "login"],
        ]),
      ) ?? "",
    adminEmail:
      toTrimmedString(
        findFirstValue(source, [
          ["adminEmail"],
          ["admin", "email"],
          ["adminUser", "email"],
          ["owner", "email"],
        ]),
      ) ?? "",
    createdAt: toDateInputValue(
      findFirstValue(source, [["createdAt"], ["created_at"], ["creationDate"]]),
    ),
    updatedAt: toDateInputValue(
      findFirstValue(source, [["updatedAt"], ["updated_at"], ["lastUpdate"]]),
    ),
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    ["content"],
    ["items"],
    ["tenants"],
    ["clients"],
    ["rows"],
    ["results"],
    ["data"],
  ];

  for (const path of candidates) {
    const candidate = getValueByPath(data, path);

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested = extractList(candidate);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function extractSingleRecord(data: unknown): unknown {
  if (isRecord(data)) {
    const nestedCandidates = [
      ["data"],
      ["item"],
      ["tenant"],
      ["client"],
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

function extractTotal(data: unknown, itemsLength: number): number {
  const directTotal = findFirstValue(data, [
    ["total"],
    ["totalElements"],
    ["count"],
    ["totalCount"],
  ]);

  if (typeof directTotal === "number" && Number.isFinite(directTotal)) {
    return directTotal;
  }

  if (typeof directTotal === "string") {
    const parsed = Number(directTotal);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return itemsLength;
}

function sanitizeCreatePayload(payload: CreateMasterTenantPayload) {
  return {
    name: payload.name.trim(),
    status: payload.status.trim().toUpperCase(),
    logoUrl: normalizeTenantLogoUrl(payload.logoUrl),
    themeKey: normalizeTenantTheme(payload.themeKey),
    adminUser: {
      name: payload.adminName.trim(),
      username: payload.adminUsername.trim(),
      email: payload.adminEmail.trim(),
      password: payload.adminPassword,
    },
  };
}

function sanitizeUpdatePayload(payload: UpdateMasterTenantPayload) {
  return {
    name: payload.name.trim(),
    code: payload.code.trim(),
    status: payload.status.trim().toUpperCase(),
    logoUrl: normalizeTenantLogoUrl(payload.logoUrl),
    themeKey: normalizeTenantTheme(payload.themeKey),
  };
}

function shouldTryNextEndpoint(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  return [404, 405].includes(error.response.status);
}

async function requestTenantsApi<T>(
  executor: (basePath: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (const endpoint of TENANTS_ENDPOINTS) {
    try {
      return await executor(endpoint);
    } catch (error) {
      if (shouldTryNextEndpoint(error)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Nao foi possivel acessar o endpoint de bancos.");
}

export async function listMasterTenants(
  filters: MasterTenantFilters = { name: "", status: "" },
): Promise<MasterTenantsListResult> {
  ensureApiConfigured();

  const data = await requestTenantsApi(async (basePath) => {
    const response = await http.get(basePath, {
      params: {
        ...DEFAULT_LIST_PARAMS,
        name: filters.name || undefined,
        status: filters.status || undefined,
      },
    });

    return response.data;
  });

  const rawItems = extractList(data);
  const items = rawItems
    .map((item) => normalizeMasterTenant(item))
    .filter((item) => Boolean(item.id));

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getMasterTenantById(id: string): Promise<MasterTenantItem> {
  ensureApiConfigured();

  const data = await requestTenantsApi(async (basePath) => {
    const response = await http.get(`${basePath}/${id}`);
    return response.data;
  });

  const tenant = normalizeMasterTenant(extractSingleRecord(data));

  if (!tenant.id) {
    throw new Error("Nao foi possivel carregar os dados do banco.");
  }

  return tenant;
}

export async function createMasterTenant(
  payload: CreateMasterTenantPayload,
): Promise<MasterTenantItem> {
  ensureApiConfigured();

  const data = await requestTenantsApi(async (basePath) => {
    const response = await http.post(basePath, sanitizeCreatePayload(payload));
    return response.data;
  });

  return normalizeMasterTenant(extractSingleRecord(data));
}

export async function updateMasterTenant(
  id: string,
  payload: UpdateMasterTenantPayload,
): Promise<MasterTenantItem> {
  ensureApiConfigured();

  const data = await requestTenantsApi(async (basePath) => {
    const sanitizedPayload = sanitizeUpdatePayload(payload);

    try {
      const response = await http.patch(`${basePath}/${id}`, sanitizedPayload);
      return response.data;
    } catch (error) {
      if (!shouldTryNextEndpoint(error)) {
        throw error;
      }
    }

    const response = await http.put(`${basePath}/${id}`, sanitizedPayload);
    return response.data;
  });

  return normalizeMasterTenant(extractSingleRecord(data));
}

export async function activateMasterTenant(id: string): Promise<void> {
  ensureApiConfigured();

  await requestTenantsApi(async (basePath) => {
    try {
      await http.patch(`${basePath}/${id}/activate`);
      return;
    } catch (error) {
      if (!shouldTryNextEndpoint(error)) {
        throw error;
      }
    }

    try {
      await http.patch(`${basePath}/${id}/status`, { status: "ACTIVE" });
      return;
    } catch (error) {
      if (!shouldTryNextEndpoint(error)) {
        throw error;
      }
    }

    await http.patch(`${basePath}/${id}`, { status: "ACTIVE" });
  });
}

export async function inactivateMasterTenant(id: string): Promise<void> {
  ensureApiConfigured();

  await requestTenantsApi(async (basePath) => {
    try {
      await http.patch(`${basePath}/${id}/inactivate`);
      return;
    } catch (error) {
      if (!shouldTryNextEndpoint(error)) {
        throw error;
      }
    }

    try {
      await http.patch(`${basePath}/${id}/status`, { status: "INACTIVE" });
      return;
    } catch (error) {
      if (!shouldTryNextEndpoint(error)) {
        throw error;
      }
    }

    await http.patch(`${basePath}/${id}`, { status: "INACTIVE" });
  });
}
