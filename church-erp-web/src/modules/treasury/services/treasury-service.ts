import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateTreasuryPayload,
  TreasuryCategoryItem,
  TreasuryFilters,
  TreasuryListResult,
  TreasuryMovementItem,
  TreasurySummary,
  UpdateTreasuryPayload,
} from "@/modules/treasury/types/treasury";

type JsonRecord = Record<string, unknown>;

const MOVEMENTS_ENDPOINTS = [
  "/tenant/financial-transactions",
  "/tenant/treasury/movements",
  "/tenant/movements",
  "/financial-transactions",
  "/treasury/movements",
  "/tesouraria/movimentacoes",
  "/movements",
  "/movimentacoes",
];

const CATEGORIES_ENDPOINTS = [
  "/tenant/financial-categories",
  "/tenant/treasury/categories",
  "/tenant/categorias-financeiras",
  "/financial-categories",
  "/treasury/categories",
  "/tesouraria/categorias",
  "/categorias-financeiras",
  "/categories/financial",
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

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
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

function normalizeType(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim().toUpperCase();

    if (["ENTRADA", "RECEITA", "CREDIT"].includes(normalized)) {
      return "INCOME";
    }

    if (["SAIDA", "DESPESA", "DEBIT"].includes(normalized)) {
      return "EXPENSE";
    }

    return normalized;
  }

  return "INCOME";
}

function normalizeMovement(source: unknown): TreasuryMovementItem {
  const id =
    toTrimmedString(
      findFirstValue(source, [["id"], ["uuid"], ["movementId"], ["transactionId"]]),
    ) ?? "";

  return {
    id,
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
    categoryId:
      toTrimmedString(
        findFirstValue(source, [["categoryId"], ["category_id"], ["category", "id"]]),
      ) ?? "",
    categoryName:
      toTrimmedString(
        findFirstValue(source, [
          ["categoryName"],
          ["category_name"],
          ["category", "name"],
          ["categoria", "name"],
          ["categoria", "nome"],
        ]),
      ) ?? "",
    type: normalizeType(findFirstValue(source, [["type"], ["movementType"], ["tipo"]])),
    description:
      toTrimmedString(
        findFirstValue(source, [["description"], ["descricao"], ["title"]]),
      ) ?? "Movimentacao sem descricao",
    amount: toNumber(findFirstValue(source, [["amount"], ["valor"], ["total"]])),
    transactionDate: toDateInputValue(
      findFirstValue(source, [["transactionDate"], ["transaction_date"], ["date"], ["dataMovimento"]]),
    ),
    notes:
      toTrimmedString(
        findFirstValue(source, [["notes"], ["observations"], ["obs"]]),
      ) ?? "",
    status:
      toTrimmedString(
        findFirstValue(source, [["status"], ["situacao"], ["state"]]),
      ) ?? "",
  };
}

function normalizeCategory(source: unknown): TreasuryCategoryItem {
  return {
    id:
      toTrimmedString(
        findFirstValue(source, [["id"], ["uuid"], ["categoryId"], ["category_id"]]),
      ) ?? "",
    name:
      toTrimmedString(
        findFirstValue(source, [["name"], ["nome"], ["description"]]),
      ) ?? "Categoria sem nome",
    type: normalizeType(findFirstValue(source, [["type"], ["movementType"], ["tipo"]])),
    status:
      toTrimmedString(
        findFirstValue(source, [["status"], ["situacao"], ["state"]]),
      ) ?? "",
    description:
      toTrimmedString(
        findFirstValue(source, [["description"], ["descricao"], ["notes"]]),
      ) ?? "",
  };
}

function extractList(data: unknown, keys: string[][]): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  for (const path of keys) {
    const candidate = getValueByPath(data, path);

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested = extractList(candidate, keys);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
}

function extractSingleRecord(data: unknown, keys: string[][]): unknown {
  if (isRecord(data)) {
    for (const path of keys) {
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

function computeSummary(items: TreasuryMovementItem[]): TreasurySummary {
  const income = items
    .filter((item) => item.type === "INCOME")
    .reduce((accumulator, item) => accumulator + item.amount, 0);
  const expense = items
    .filter((item) => item.type === "EXPENSE")
    .reduce((accumulator, item) => accumulator + item.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

function extractSummary(data: unknown, items: TreasuryMovementItem[]): TreasurySummary {
  const income = findFirstValue(data, [
    ["summary", "income"],
    ["summary", "totalIncome"],
    ["summary", "entrada"],
    ["totals", "income"],
    ["totals", "entrada"],
  ]);
  const expense = findFirstValue(data, [
    ["summary", "expense"],
    ["summary", "totalExpense"],
    ["summary", "saida"],
    ["totals", "expense"],
    ["totals", "saida"],
  ]);
  const balance = findFirstValue(data, [
    ["summary", "balance"],
    ["summary", "saldo"],
    ["totals", "balance"],
    ["totals", "saldo"],
  ]);

  const fallback = computeSummary(items);

  return {
    income: income !== null ? toNumber(income) : fallback.income,
    expense: expense !== null ? toNumber(expense) : fallback.expense,
    balance: balance !== null ? toNumber(balance) : fallback.balance,
  };
}

function sanitizePayload<T extends CreateTreasuryPayload | UpdateTreasuryPayload>(
  payload: T,
) {
  return {
    ...payload,
    churchId: payload.churchId.trim(),
    categoryId: payload.categoryId.trim(),
    type: payload.type.trim().toUpperCase(),
    description: payload.description.trim(),
    amount: Number(payload.amount),
    transactionDate: payload.transactionDate.trim(),
    notes: payload.notes.trim(),
    status: payload.status.trim(),
  };
}

function shouldTryNextEndpoint(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  return [404, 405].includes(error.response.status);
}

async function requestWithFallback<T>(
  endpoints: string[],
  executor: (basePath: string) => Promise<T>,
): Promise<T> {
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
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

  throw lastError ?? new Error("Nao foi possivel acessar o endpoint solicitado.");
}

export async function listTreasuryMovements(
  filters: TreasuryFilters,
): Promise<TreasuryListResult> {
  ensureApiConfigured();

  const data = await requestWithFallback(MOVEMENTS_ENDPOINTS, async (basePath) => {
    const response = await http.get(basePath, {
      params: {
        ...DEFAULT_LIST_PARAMS,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type || undefined,
        categoryId: filters.categoryId || undefined,
        churchId: filters.churchId || undefined,
      },
    });

    return response.data;
  });

  const rawItems = extractList(data, [
    ["content"],
    ["items"],
    ["movements"],
    ["transactions"],
    ["movimentacoes"],
    ["rows"],
    ["results"],
    ["data"],
  ]);

  const items = rawItems
    .map((item) => normalizeMovement(item))
    .filter((item) => Boolean(item.id));

  return {
    items,
    total: extractTotal(data, items.length),
    summary: extractSummary(data, items),
  };
}

export async function getTreasuryMovementById(
  id: string,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const data = await requestWithFallback(MOVEMENTS_ENDPOINTS, async (basePath) => {
    const response = await http.get(`${basePath}/${id}`);
    return response.data;
  });

  const movement = normalizeMovement(
    extractSingleRecord(data, [
      ["data"],
      ["item"],
      ["movement"],
      ["transaction"],
      ["movimentacao"],
      ["payload"],
      ["result"],
    ]),
  );

  if (!movement.id) {
    throw new Error("Nao foi possivel carregar os dados da movimentacao.");
  }

  return movement;
}

export async function createTreasuryMovement(
  payload: CreateTreasuryPayload,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const data = await requestWithFallback(MOVEMENTS_ENDPOINTS, async (basePath) => {
    const response = await http.post(basePath, sanitizePayload(payload));
    return response.data;
  });

  return normalizeMovement(
    extractSingleRecord(data, [
      ["data"],
      ["item"],
      ["movement"],
      ["transaction"],
      ["movimentacao"],
      ["payload"],
      ["result"],
    ]),
  );
}

export async function updateTreasuryMovement(
  id: string,
  payload: UpdateTreasuryPayload,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const data = await requestWithFallback(MOVEMENTS_ENDPOINTS, async (basePath) => {
    const response = await http.put(`${basePath}/${id}`, sanitizePayload(payload));
    return response.data;
  });

  return normalizeMovement(
    extractSingleRecord(data, [
      ["data"],
      ["item"],
      ["movement"],
      ["transaction"],
      ["movimentacao"],
      ["payload"],
      ["result"],
    ]),
  );
}

export async function listTreasuryCategories(): Promise<TreasuryCategoryItem[]> {
  ensureApiConfigured();

  const data = await requestWithFallback(CATEGORIES_ENDPOINTS, async (basePath) => {
    const response = await http.get(basePath);
    return response.data;
  });

  const rawItems = extractList(data, [
    ["content"],
    ["items"],
    ["categories"],
    ["categorias"],
    ["rows"],
    ["results"],
    ["data"],
  ]);

  return rawItems
    .map((item) => normalizeCategory(item))
    .filter((item) => Boolean(item.id));
}
