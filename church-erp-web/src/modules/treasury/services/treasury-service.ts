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

const FINANCE_CATEGORIES_ENDPOINT = "/finance/categories";
const FINANCE_TRANSACTIONS_ENDPOINT = "/finance/transactions";

function toAmountNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeTreasuryPayload(
  payload: CreateTreasuryPayload | UpdateTreasuryPayload,
) {
  const sanitizedPayload = {
    ...payload,
    churchId:
      "churchId" in payload && payload.churchId !== undefined
        ? payload.churchId.trim()
        : undefined,
    categoryId:
      "categoryId" in payload && payload.categoryId !== undefined
        ? payload.categoryId.trim()
        : undefined,
    type: payload.type,
    description:
      "description" in payload && payload.description !== undefined
        ? payload.description.trim()
        : undefined,
    amount:
      "amount" in payload && payload.amount !== undefined
        ? payload.amount.trim().replace(",", ".")
        : undefined,
    transactionDate:
      "transactionDate" in payload && payload.transactionDate !== undefined
        ? payload.transactionDate.trim()
        : undefined,
    notes:
      "notes" in payload && payload.notes !== undefined
        ? payload.notes?.trim() || null
        : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

function computeSummary(items: TreasuryMovementItem[]): TreasurySummary {
  return items.reduce<TreasurySummary>(
    (summary, item) => {
      if (item.status === "CANCELLED") {
        return summary;
      }

      const amount = toAmountNumber(item.amount);

      if (item.type === "ENTRY") {
        summary.income += amount;
        summary.balance += amount;
        return summary;
      }

      summary.expense += amount;
      summary.balance -= amount;
      return summary;
    },
    { income: 0, expense: 0, balance: 0 },
  );
}

export async function listTreasuryMovements(
  filters: TreasuryFilters,
): Promise<TreasuryListResult> {
  ensureApiConfigured();

  const response = await http.get<TreasuryMovementItem[]>(
    FINANCE_TRANSACTIONS_ENDPOINT,
    {
      params: {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type || undefined,
        categoryId: filters.categoryId || undefined,
        churchId: filters.churchId || undefined,
      },
    },
  );

  return {
    items: response.data,
    total: response.data.length,
    summary: computeSummary(response.data),
  };
}

export async function getTreasuryMovementById(
  id: string,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const response = await http.get<TreasuryMovementItem>(
    `${FINANCE_TRANSACTIONS_ENDPOINT}/${id}`,
  );

  return response.data;
}

export async function createTreasuryMovement(
  payload: CreateTreasuryPayload,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const response = await http.post<TreasuryMovementItem>(
    FINANCE_TRANSACTIONS_ENDPOINT,
    sanitizeTreasuryPayload(payload),
  );

  return response.data;
}

export async function updateTreasuryMovement(
  id: string,
  payload: UpdateTreasuryPayload,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const response = await http.patch<TreasuryMovementItem>(
    `${FINANCE_TRANSACTIONS_ENDPOINT}/${id}`,
    sanitizeTreasuryPayload(payload),
  );

  return response.data;
}

export async function cancelTreasuryMovement(
  id: string,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const response = await http.patch<TreasuryMovementItem>(
    `${FINANCE_TRANSACTIONS_ENDPOINT}/${id}/cancel`,
  );

  return response.data;
}

export async function listTreasuryCategories(): Promise<TreasuryCategoryItem[]> {
  ensureApiConfigured();

  const response = await http.get<TreasuryCategoryItem[]>(
    FINANCE_CATEGORIES_ENDPOINT,
  );

  return response.data;
}
