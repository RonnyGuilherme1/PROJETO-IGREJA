import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import type {
  ChurchFilters,
  ChurchItem,
  ChurchListResult,
  CreateChurchPayload,
  UpdateChurchPayload,
} from "@/modules/churches/types/church";

type JsonRecord = Record<string, unknown>;

const CHURCHES_ENDPOINTS = [
  "/tenant/churches",
  "/churches",
  "/tenant/igrejas",
  "/igrejas",
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

function normalizeStatus(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "ACTIVE" : "INACTIVE";
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toUpperCase();

    if (normalized === "ATIVA") {
      return "ACTIVE";
    }

    if (normalized === "INATIVA") {
      return "INACTIVE";
    }

    return normalized;
  }

  return "ACTIVE";
}

function normalizeChurch(source: unknown): ChurchItem {
  const id =
    toTrimmedString(
      findFirstValue(source, [["id"], ["uuid"], ["churchId"], ["church_id"]]),
    ) ?? "";

  return {
    id,
    name:
      toTrimmedString(
        findFirstValue(source, [["name"], ["nome"], ["fantasyName"]]),
      ) ?? "Igreja sem nome",
    cnpj:
      toTrimmedString(
        findFirstValue(source, [["cnpj"], ["document"], ["taxId"]]),
      ) ?? "",
    phone:
      toTrimmedString(
        findFirstValue(source, [["phone"], ["telefone"], ["cellphone"]]),
      ) ?? "",
    email:
      toTrimmedString(
        findFirstValue(source, [["email"], ["mail"], ["contactEmail"]]),
      ) ?? "",
    address: toAddressString(
      findFirstValue(source, [["address"], ["endereco"], ["location"]]),
    ),
    pastorName:
      toTrimmedString(
        findFirstValue(source, [
          ["pastorName"],
          ["pastor", "name"],
          ["responsibleName"],
          ["responsavel"],
        ]),
      ) ?? "",
    status: normalizeStatus(
      findFirstValue(source, [["status"], ["active"], ["enabled"]]),
    ),
    notes:
      toTrimmedString(
        findFirstValue(source, [["notes"], ["observations"], ["obs"]]),
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
    ["churches"],
    ["igrejas"],
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
      ["church"],
      ["igreja"],
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

function sanitizePayload<T extends CreateChurchPayload | UpdateChurchPayload>(
  payload: T,
) {
  return {
    ...payload,
    name: payload.name.trim(),
    cnpj: payload.cnpj.trim(),
    phone: payload.phone.trim(),
    email: payload.email.trim(),
    address: payload.address.trim(),
    pastorName: payload.pastorName.trim(),
    status: payload.status.trim().toUpperCase(),
    notes: payload.notes.trim(),
  };
}

function shouldTryNextEndpoint(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  return [404, 405].includes(error.response.status);
}

async function requestChurchesApi<T>(
  executor: (basePath: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (const endpoint of CHURCHES_ENDPOINTS) {
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

  throw lastError ?? new Error("Nao foi possivel acessar o endpoint de igrejas.");
}

export async function listChurches(
  filters: ChurchFilters,
): Promise<ChurchListResult> {
  ensureApiConfigured();

  const data = await requestChurchesApi(async (basePath) => {
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
    .map((item) => normalizeChurch(item))
    .filter((item) => Boolean(item.id));

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getChurchById(id: string): Promise<ChurchItem> {
  ensureApiConfigured();

  const data = await requestChurchesApi(async (basePath) => {
    const response = await http.get(`${basePath}/${id}`);
    return response.data;
  });

  const church = normalizeChurch(extractSingleRecord(data));

  if (!church.id) {
    throw new Error("Nao foi possivel carregar os dados da igreja.");
  }

  return church;
}

export async function createChurch(
  payload: CreateChurchPayload,
): Promise<ChurchItem> {
  ensureApiConfigured();

  const data = await requestChurchesApi(async (basePath) => {
    const response = await http.post(basePath, sanitizePayload(payload));
    return response.data;
  });

  return normalizeChurch(extractSingleRecord(data));
}

export async function updateChurch(
  id: string,
  payload: UpdateChurchPayload,
): Promise<ChurchItem> {
  ensureApiConfigured();

  const data = await requestChurchesApi(async (basePath) => {
    const response = await http.put(`${basePath}/${id}`, sanitizePayload(payload));
    return response.data;
  });

  return normalizeChurch(extractSingleRecord(data));
}
