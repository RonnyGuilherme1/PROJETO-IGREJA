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
const FINANCE_MONTHLY_CLOSURE_ENDPOINT = "/finance/monthly-closure";

export interface TreasuryMonthlyClosureStatus {
  year: number;
  month: number;
  closed: boolean;
  closedAt: string | null;
  closedByUserId: string | null;
  incomeAmount: string;
  expenseAmount: string;
  balanceAmount: string;
  transactionCount: number;
}

export interface TreasuryExportFile {
  blob: Blob;
  filename: string;
}

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
    receiptUrl:
      "receiptUrl" in payload && payload.receiptUrl !== undefined
        ? payload.receiptUrl?.trim() || null
        : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

function buildTreasuryFormData(
  payload: CreateTreasuryPayload | UpdateTreasuryPayload,
  receiptFile: File,
) {
  const sanitizedPayload = sanitizeTreasuryPayload(payload);
  const formData = new FormData();

  for (const [key, value] of Object.entries(sanitizedPayload)) {
    formData.append(key, value === null ? "" : String(value));
  }

  formData.append("receipt", receiptFile);

  return formData;
}

function computeSummary(items: TreasuryMovementItem[]): TreasurySummary {
  return items.reduce<TreasurySummary>(
    (summary, item) => {
      summary.transactionCount += 1;

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
    { income: 0, expense: 0, balance: 0, transactionCount: 0 },
  );
}

function resolveExportFilename(contentDisposition?: string) {
  if (!contentDisposition) {
    return `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  const utf8FilenameMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (utf8FilenameMatch?.[1]) {
    return decodeURIComponent(utf8FilenameMatch[1]);
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
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
        status: filters.status || undefined,
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
  receiptFile?: File | null,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const response = receiptFile
    ? await http.postForm<TreasuryMovementItem>(
        FINANCE_TRANSACTIONS_ENDPOINT,
        buildTreasuryFormData(payload, receiptFile),
      )
    : await http.post<TreasuryMovementItem>(
        FINANCE_TRANSACTIONS_ENDPOINT,
        sanitizeTreasuryPayload(payload),
      );

  return response.data;
}

export async function updateTreasuryMovement(
  id: string,
  payload: UpdateTreasuryPayload,
  receiptFile?: File | null,
): Promise<TreasuryMovementItem> {
  ensureApiConfigured();

  const response = receiptFile
    ? await http.patchForm<TreasuryMovementItem>(
        `${FINANCE_TRANSACTIONS_ENDPOINT}/${id}`,
        buildTreasuryFormData(payload, receiptFile),
      )
    : await http.patch<TreasuryMovementItem>(
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

export async function getTreasuryMonthlyClosureStatus(
  year: number,
  month: number,
): Promise<TreasuryMonthlyClosureStatus> {
  ensureApiConfigured();

  const response = await http.get<TreasuryMonthlyClosureStatus>(
    FINANCE_MONTHLY_CLOSURE_ENDPOINT,
    {
      params: {
        year,
        month,
      },
    },
  );

  return response.data;
}

export async function closeTreasuryMonth(
  year: number,
  month: number,
): Promise<TreasuryMonthlyClosureStatus> {
  ensureApiConfigured();

  const response = await http.post<TreasuryMonthlyClosureStatus>(
    FINANCE_MONTHLY_CLOSURE_ENDPOINT,
    {
      year,
      month,
    },
  );

  return response.data;
}

export async function exportTreasuryMovements(
  filters: TreasuryFilters,
): Promise<TreasuryExportFile> {
  ensureApiConfigured();

  const response = await http.get<Blob>(`${FINANCE_TRANSACTIONS_ENDPOINT}/export`, {
    params: {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      type: filters.type || undefined,
      categoryId: filters.categoryId || undefined,
      churchId: filters.churchId || undefined,
      status: filters.status || undefined,
    },
    responseType: "blob",
  });

  return {
    blob: response.data,
    filename: resolveExportFilename(response.headers["content-disposition"]),
  };
}

export async function listTreasuryCategories(): Promise<TreasuryCategoryItem[]> {
  ensureApiConfigured();

  const response = await http.get<TreasuryCategoryItem[]>(
    FINANCE_CATEGORIES_ENDPOINT,
  );

  return response.data;
}
