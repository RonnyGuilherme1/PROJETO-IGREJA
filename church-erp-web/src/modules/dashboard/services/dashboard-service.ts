import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import type {
  DashboardFinancePoint,
  DashboardMembersGrowthPoint,
  DashboardOverviewData,
} from "@/modules/dashboard/types/dashboard";

type JsonRecord = Record<string, unknown>;

interface RawMemberItem {
  joinedAt: Date | null;
}

interface RawMovementItem {
  type: string;
  amount: number;
  transactionDate: Date | null;
}

interface MonthBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

const MEMBERS_ENDPOINTS = ["/tenant/members", "/members", "/tenant/membros", "/membros"];
const CHURCHES_ENDPOINTS = [
  "/tenant/churches",
  "/churches",
  "/tenant/igrejas",
  "/igrejas",
];
const USERS_ENDPOINTS = ["/tenant/users", "/users", "/tenant/usuarios", "/usuarios"];
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

function toDateValue(value: unknown): Date | null {
  if (typeof value === "string" && value.trim()) {
    const rawValue = value.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(rawValue)) {
      const [year, month, day] = rawValue.slice(0, 10).split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(rawValue);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
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

  return "";
}

function normalizeMovementType(value: unknown): string {
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

function createMonthBuckets(monthsCount: number): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const now = new Date();

  for (let index = monthsCount - 1; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const month = String(monthDate.getMonth() + 1).padStart(2, "0");
    const year = String(monthDate.getFullYear()).slice(-2);

    buckets.push({
      key: `${monthDate.getFullYear()}-${month}`,
      label: `${month}/${year}`,
      start: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      end: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
    });
  }

  return buckets;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeMemberItem(source: unknown): RawMemberItem {
  return {
    joinedAt: toDateValue(
      findFirstValue(source, [
        ["joinedAt"],
        ["joined_at"],
        ["admissionDate"],
        ["dataEntrada"],
        ["createdAt"],
        ["created_at"],
      ]),
    ),
  };
}

function normalizeMovementItem(source: unknown): RawMovementItem {
  return {
    type: normalizeMovementType(
      findFirstValue(source, [["type"], ["movementType"], ["tipo"]]),
    ),
    amount: toNumber(findFirstValue(source, [["amount"], ["valor"], ["total"]])),
    transactionDate: toDateValue(
      findFirstValue(source, [
        ["transactionDate"],
        ["transaction_date"],
        ["date"],
        ["dataMovimento"],
        ["createdAt"],
        ["created_at"],
      ]),
    ),
  };
}

async function fetchMembersSnapshot() {
  const data = await requestWithFallback(MEMBERS_ENDPOINTS, async (basePath) => {
    const response = await http.get(basePath, {
      params: DEFAULT_LIST_PARAMS,
    });

    return response.data;
  });

  const items = extractList(data, [
    ["content"],
    ["items"],
    ["members"],
    ["membros"],
    ["rows"],
    ["results"],
    ["data"],
  ]).map((item) => normalizeMemberItem(item));

  return {
    total: extractTotal(data, items.length),
    items,
  };
}

async function fetchChurchesTotal() {
  const data = await requestWithFallback(CHURCHES_ENDPOINTS, async (basePath) => {
    const response = await http.get(basePath, {
      params: DEFAULT_LIST_PARAMS,
    });

    return response.data;
  });

  const items = extractList(data, [
    ["content"],
    ["items"],
    ["churches"],
    ["igrejas"],
    ["rows"],
    ["results"],
    ["data"],
  ]);

  return extractTotal(data, items.length);
}

async function fetchActiveUsersTotal() {
  const data = await requestWithFallback(USERS_ENDPOINTS, async (basePath) => {
    const response = await http.get(basePath, {
      params: {
        ...DEFAULT_LIST_PARAMS,
        status: "ACTIVE",
      },
    });

    return response.data;
  });

  const items = extractList(data, [
    ["content"],
    ["items"],
    ["users"],
    ["usuarios"],
    ["rows"],
    ["results"],
    ["data"],
  ]);

  const filteredItems = items.filter((item) => {
    const status = normalizeStatus(
      findFirstValue(item, [["status"], ["active"], ["enabled"]]),
    );

    return status === "ACTIVE";
  });

  const total = extractTotal(data, filteredItems.length);

  if (filteredItems.length > 0 && total < filteredItems.length) {
    return filteredItems.length;
  }

  return total || filteredItems.length;
}

async function fetchTreasuryMovements(monthBuckets: MonthBucket[]) {
  const firstBucket = monthBuckets[0];
  const lastBucket = monthBuckets[monthBuckets.length - 1];

  const data = await requestWithFallback(MOVEMENTS_ENDPOINTS, async (basePath) => {
    const response = await http.get(basePath, {
      params: {
        ...DEFAULT_LIST_PARAMS,
        startDate: formatDateInput(firstBucket.start),
        endDate: formatDateInput(lastBucket.end),
      },
    });

    return response.data;
  });

  return extractList(data, [
    ["content"],
    ["items"],
    ["movements"],
    ["transactions"],
    ["movimentacoes"],
    ["rows"],
    ["results"],
    ["data"],
  ]).map((item) => normalizeMovementItem(item));
}

function buildFinanceSeries(
  monthBuckets: MonthBucket[],
  movements: RawMovementItem[],
): DashboardFinancePoint[] {
  return monthBuckets.map((bucket) => {
    let income = 0;
    let expense = 0;

    for (const movement of movements) {
      if (!movement.transactionDate) {
        continue;
      }

      if (getMonthKey(movement.transactionDate) !== bucket.key) {
        continue;
      }

      if (movement.type === "INCOME") {
        income += movement.amount;
      } else if (movement.type === "EXPENSE") {
        expense += movement.amount;
      }
    }

    return {
      monthKey: bucket.key,
      label: bucket.label,
      income,
      expense,
    };
  });
}

function buildMembersGrowthSeries(
  monthBuckets: MonthBucket[],
  members: RawMemberItem[],
): DashboardMembersGrowthPoint[] {
  return monthBuckets.map((bucket) => {
    let newMembers = 0;

    for (const member of members) {
      if (!member.joinedAt) {
        continue;
      }

      if (getMonthKey(member.joinedAt) === bucket.key) {
        newMembers += 1;
      }
    }

    return {
      monthKey: bucket.key,
      label: bucket.label,
      newMembers,
    };
  });
}

function getPeriodLabel(monthBuckets: MonthBucket[]) {
  const firstBucket = monthBuckets[0];
  const lastBucket = monthBuckets[monthBuckets.length - 1];

  if (!firstBucket || !lastBucket) {
    return "";
  }

  return `${firstBucket.label} ate ${lastBucket.label}`;
}

export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
  ensureApiConfigured();

  const monthBuckets = createMonthBuckets(6);
  const [membersSnapshot, totalChurches, activeUsers, movements] =
    await Promise.all([
      fetchMembersSnapshot(),
      fetchChurchesTotal(),
      fetchActiveUsersTotal(),
      fetchTreasuryMovements(monthBuckets),
    ]);

  const financeSeries = buildFinanceSeries(monthBuckets, movements);
  const membersGrowthSeries = buildMembersGrowthSeries(
    monthBuckets,
    membersSnapshot.items,
  );
  const currentMonth = financeSeries[financeSeries.length - 1] ?? {
    monthKey: "",
    label: "",
    income: 0,
    expense: 0,
  };

  return {
    metrics: {
      totalMembers: membersSnapshot.total,
      totalChurches,
      monthlyIncome: currentMonth.income,
      monthlyExpense: currentMonth.expense,
      monthlyBalance: currentMonth.income - currentMonth.expense,
      activeUsers,
    },
    financeSeries,
    membersGrowthSeries,
    currentMonthLabel: currentMonth.label,
    financePeriodLabel: getPeriodLabel(monthBuckets),
    membersPeriodLabel: getPeriodLabel(monthBuckets),
  };
}
