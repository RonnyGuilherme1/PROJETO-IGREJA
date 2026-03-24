import { ensureApiConfigured, http } from "@/lib/http";
import type {
  ChurchFilters,
  ChurchItem,
  ChurchListResult,
  CreateChurchPayload,
  UpdateChurchPayload,
} from "@/modules/churches/types/church";

const CHURCHES_ENDPOINT = "/churches";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesChurchFilters(church: ChurchItem, filters: ChurchFilters) {
  const name = normalizeSearchValue(filters.name);
  const status = normalizeSearchValue(filters.status);

  return (
    (!name || normalizeSearchValue(church.name).includes(name)) &&
    (!status || normalizeSearchValue(church.status).includes(status))
  );
}

function sanitizeChurchPayload(
  payload: CreateChurchPayload | UpdateChurchPayload,
) {
  const sanitizedPayload = {
    ...payload,
    name: payload.name?.trim(),
    cnpj:
      "cnpj" in payload && payload.cnpj !== undefined
        ? payload.cnpj?.trim() || null
        : undefined,
    phone:
      "phone" in payload && payload.phone !== undefined
        ? payload.phone?.trim() || null
        : undefined,
    email:
      "email" in payload && payload.email !== undefined
        ? payload.email?.trim().toLowerCase() || null
        : undefined,
    address:
      "address" in payload && payload.address !== undefined
        ? payload.address?.trim() || null
        : undefined,
    pastorName:
      "pastorName" in payload && payload.pastorName !== undefined
        ? payload.pastorName?.trim() || null
        : undefined,
    status: payload.status,
    notes:
      "notes" in payload && payload.notes !== undefined
        ? payload.notes?.trim() || null
        : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listChurches(
  filters: ChurchFilters,
): Promise<ChurchListResult> {
  ensureApiConfigured();

  const response = await http.get<ChurchItem[]>(CHURCHES_ENDPOINT);
  const items = response.data.filter((church) =>
    matchesChurchFilters(church, filters),
  );

  return {
    items,
    total: items.length,
  };
}

export async function getChurchById(id: string): Promise<ChurchItem> {
  ensureApiConfigured();

  const response = await http.get<ChurchItem>(`${CHURCHES_ENDPOINT}/${id}`);
  return response.data;
}

export async function createChurch(
  payload: CreateChurchPayload,
): Promise<ChurchItem> {
  ensureApiConfigured();

  const response = await http.post<ChurchItem>(
    CHURCHES_ENDPOINT,
    sanitizeChurchPayload(payload),
  );

  return response.data;
}

export async function updateChurch(
  id: string,
  payload: UpdateChurchPayload,
): Promise<ChurchItem> {
  ensureApiConfigured();

  const response = await http.patch<ChurchItem>(
    `${CHURCHES_ENDPOINT}/${id}`,
    sanitizeChurchPayload(payload),
  );

  return response.data;
}
