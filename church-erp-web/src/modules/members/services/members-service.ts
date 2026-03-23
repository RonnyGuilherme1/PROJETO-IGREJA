import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateMemberPayload,
  MemberFilters,
  MemberItem,
  MemberListResult,
  UpdateMemberPayload,
} from "@/modules/members/types/member";

type JsonRecord = Record<string, unknown>;

const MEMBERS_ENDPOINTS = ["/tenant/members", "/members", "/tenant/membros", "/membros"];

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

function toAddressString(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!isRecord(value)) {
    return "";
  }

  const parts = [
    toTrimmedString(value.street),
    toTrimmedString(value.number),
    toTrimmedString(value.district),
    toTrimmedString(value.city),
    toTrimmedString(value.state),
    toTrimmedString(value.zipCode),
    toTrimmedString(value.postalCode),
  ].filter(Boolean);

  return parts.join(", ");
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

function normalizeMember(source: unknown): MemberItem {
  const id =
    toTrimmedString(
      findFirstValue(source, [["id"], ["uuid"], ["memberId"], ["member_id"]]),
    ) ?? "";

  return {
    id,
    fullName:
      toTrimmedString(
        findFirstValue(source, [["fullName"], ["name"], ["nome"]]),
      ) ?? "Membro sem nome",
    birthDate: toDateInputValue(
      findFirstValue(source, [["birthDate"], ["birth_date"], ["dataNascimento"]]),
    ),
    gender:
      toTrimmedString(
        findFirstValue(source, [["gender"], ["sexo"]]),
      ) ?? "",
    phone:
      toTrimmedString(
        findFirstValue(source, [["phone"], ["telefone"], ["cellphone"]]),
      ) ?? "",
    email:
      toTrimmedString(
        findFirstValue(source, [["email"], ["mail"]]),
      ) ?? "",
    address: toAddressString(
      findFirstValue(source, [["address"], ["endereco"], ["location"]]),
    ),
    maritalStatus:
      toTrimmedString(
        findFirstValue(source, [["maritalStatus"], ["marital_status"], ["estadoCivil"]]),
      ) ?? "",
    joinedAt: toDateInputValue(
      findFirstValue(source, [["joinedAt"], ["joined_at"], ["admissionDate"], ["dataEntrada"]]),
    ),
    status: normalizeStatus(
      findFirstValue(source, [["status"], ["active"], ["enabled"]]),
    ),
    notes:
      toTrimmedString(
        findFirstValue(source, [["notes"], ["observations"], ["obs"]]),
      ) ?? "",
    churchId:
      toTrimmedString(
        findFirstValue(source, [["churchId"], ["church_id"], ["church", "id"], ["igreja", "id"]]),
      ) ?? "",
    churchName:
      toTrimmedString(
        findFirstValue(source, [
          ["churchName"],
          ["church_name"],
          ["church", "name"],
          ["church", "nome"],
          ["igreja", "name"],
          ["igreja", "nome"],
        ]),
      ) ?? "",
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    ["content"],
    ["items"],
    ["members"],
    ["membros"],
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
      ["member"],
      ["membro"],
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

function sanitizePayload<T extends CreateMemberPayload | UpdateMemberPayload>(
  payload: T,
) {
  return {
    ...payload,
    fullName: payload.fullName.trim(),
    birthDate: payload.birthDate.trim(),
    gender: payload.gender.trim(),
    phone: payload.phone.trim(),
    email: payload.email.trim(),
    address: payload.address.trim(),
    maritalStatus: payload.maritalStatus.trim(),
    joinedAt: payload.joinedAt.trim(),
    status: payload.status.trim().toUpperCase(),
    notes: payload.notes.trim(),
    churchId: payload.churchId.trim(),
  };
}

function shouldTryNextEndpoint(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  return [404, 405].includes(error.response.status);
}

async function requestMembersApi<T>(
  executor: (basePath: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (const endpoint of MEMBERS_ENDPOINTS) {
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

  throw lastError ?? new Error("Nao foi possivel acessar o endpoint de membros.");
}

export async function listMembers(
  filters: MemberFilters,
): Promise<MemberListResult> {
  ensureApiConfigured();

  const data = await requestMembersApi(async (basePath) => {
    const response = await http.get(basePath, {
      params: {
        ...DEFAULT_LIST_PARAMS,
        name: filters.name || undefined,
        status: filters.status || undefined,
        churchId: filters.churchId || undefined,
      },
    });

    return response.data;
  });

  const rawItems = extractList(data);
  const items = rawItems
    .map((item) => normalizeMember(item))
    .filter((item) => Boolean(item.id));

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getMemberById(id: string): Promise<MemberItem> {
  ensureApiConfigured();

  const data = await requestMembersApi(async (basePath) => {
    const response = await http.get(`${basePath}/${id}`);
    return response.data;
  });

  const member = normalizeMember(extractSingleRecord(data));

  if (!member.id) {
    throw new Error("Nao foi possivel carregar os dados do membro.");
  }

  return member;
}

export async function createMember(
  payload: CreateMemberPayload,
): Promise<MemberItem> {
  ensureApiConfigured();

  const data = await requestMembersApi(async (basePath) => {
    const response = await http.post(basePath, sanitizePayload(payload));
    return response.data;
  });

  return normalizeMember(extractSingleRecord(data));
}

export async function updateMember(
  id: string,
  payload: UpdateMemberPayload,
): Promise<MemberItem> {
  ensureApiConfigured();

  const data = await requestMembersApi(async (basePath) => {
    const response = await http.put(`${basePath}/${id}`, sanitizePayload(payload));
    return response.data;
  });

  return normalizeMember(extractSingleRecord(data));
}

export async function inactivateMember(id: string): Promise<void> {
  ensureApiConfigured();

  await requestMembersApi(async (basePath) => {
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
