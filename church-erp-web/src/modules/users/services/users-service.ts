import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserFilters,
  UserItem,
  UserListResult,
} from "@/modules/users/types/user";

type JsonRecord = Record<string, unknown>;

const USERS_ENDPOINTS = ["/tenant/users", "/users", "/tenant/usuarios", "/usuarios"];

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

function toTrimmedString(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toRoleString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = toRoleString(item);

      if (normalized) {
        return normalized;
      }
    }
  }

  if (isRecord(value)) {
    return (
      toRoleString(value.name) ??
      toRoleString(value.authority) ??
      toRoleString(value.label)
    );
  }

  return null;
}

function normalizeStatus(value: unknown) {
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

function normalizeUser(source: unknown): UserItem {
  const id =
    toTrimmedString(
      findFirstValue(source, [["id"], ["uuid"], ["userId"], ["user_id"]]),
    ) ?? "";

  return {
    id,
    name:
      toTrimmedString(
        findFirstValue(source, [["name"], ["nome"], ["fullName"]]),
      ) ?? "Usuario sem nome",
    email:
      toTrimmedString(
        findFirstValue(source, [["email"], ["mail"], ["login"]]),
      ) ?? "",
    role:
      toRoleString(
        findFirstValue(source, [["role"], ["roles"], ["profile"], ["perfil"]]),
      ) ?? "",
    status: normalizeStatus(
      findFirstValue(source, [["status"], ["active"], ["enabled"]]),
    ),
    churchId: toTrimmedString(
      findFirstValue(source, [["churchId"], ["church_id"], ["church", "id"]]),
    ),
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  const directCandidates = [
    ["content"],
    ["items"],
    ["users"],
    ["usuarios"],
    ["rows"],
    ["results"],
    ["data"],
  ];

  for (const path of directCandidates) {
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
      ["user"],
      ["usuario"],
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

function extractTotal(data: unknown, itemsLength: number) {
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

function sanitizePayload<T extends CreateUserPayload | UpdateUserPayload>(payload: T) {
  return {
    ...payload,
    name: payload.name.trim(),
    email: payload.email.trim(),
    role: payload.role.trim().toUpperCase(),
    status: payload.status.trim().toUpperCase(),
    churchId: payload.churchId?.trim() || null,
  };
}

function shouldTryNextEndpoint(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  return [404, 405].includes(error.response.status);
}

async function requestUsersApi<T>(
  executor: (basePath: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (const endpoint of USERS_ENDPOINTS) {
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

  throw lastError ?? new Error("Nao foi possivel acessar o endpoint de usuarios.");
}

export async function listUsers(filters: UserFilters): Promise<UserListResult> {
  ensureApiConfigured();

  const data = await requestUsersApi(async (basePath) => {
    const response = await http.get(basePath, {
      params: {
        ...DEFAULT_LIST_PARAMS,
        name: filters.name || undefined,
        email: filters.email || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined,
      },
    });

    return response.data;
  });

  const rawItems = extractList(data);
  const items = rawItems
    .map((item) => normalizeUser(item))
    .filter((item) => Boolean(item.id));

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getUserById(id: string): Promise<UserItem> {
  ensureApiConfigured();

  const data = await requestUsersApi(async (basePath) => {
    const response = await http.get(`${basePath}/${id}`);
    return response.data;
  });
  const user = normalizeUser(extractSingleRecord(data));

  if (!user.id) {
    throw new Error("Nao foi possivel carregar os dados do usuario.");
  }

  return user;
}

export async function createUser(payload: CreateUserPayload): Promise<UserItem> {
  ensureApiConfigured();

  const data = await requestUsersApi(async (basePath) => {
    const response = await http.post(basePath, {
      ...sanitizePayload(payload),
      password: payload.password,
    });

    return response.data;
  });

  return normalizeUser(extractSingleRecord(data));
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserItem> {
  ensureApiConfigured();

  const data = await requestUsersApi(async (basePath) => {
    const response = await http.put(`${basePath}/${id}`, sanitizePayload(payload));
    return response.data;
  });
  return normalizeUser(extractSingleRecord(data));
}

export async function inactivateUser(id: string): Promise<void> {
  ensureApiConfigured();

  await requestUsersApi(async (basePath) => {
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
