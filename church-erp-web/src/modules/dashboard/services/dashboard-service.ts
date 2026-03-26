import { ensureApiConfigured, http } from "@/lib/http";
import type {
  DashboardCardsResponse,
  DashboardFinanceByMonthResponse,
  DashboardFinancePoint,
  DashboardMembersByMonthResponse,
  DashboardMembersGrowthPoint,
  DashboardOverviewData,
} from "@/modules/dashboard/types/dashboard";

const DASHBOARD_CARDS_ENDPOINT = "/dashboard/cards";
const DASHBOARD_FINANCE_BY_MONTH_ENDPOINT = "/dashboard/finance-by-month";
const DASHBOARD_MEMBERS_BY_MONTH_ENDPOINT = "/dashboard/members-by-month";

export interface DashboardOperationalSummary {
  currentMonthMembers: number;
  previousMonthMembers: number;
  membersDelta: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthBalance: number;
  periodIncome: number;
  periodExpense: number;
  periodBalance: number;
}

export interface DashboardOverviewViewData extends DashboardOverviewData {
  operational: DashboardOperationalSummary;
}

function toAmountNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");

  if (!year || !month) {
    return monthKey;
  }

  return `${month}/${year.slice(-2)}`;
}

function buildPeriodLabel(months: string[]) {
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];

  if (!firstMonth || !lastMonth) {
    return "";
  }

  return `${formatMonthLabel(firstMonth)} ate ${formatMonthLabel(lastMonth)}`;
}

function buildFinanceSeries(
  rows: DashboardFinanceByMonthResponse[],
): DashboardFinancePoint[] {
  return rows.map((row) => ({
    monthKey: row.month,
    label: formatMonthLabel(row.month),
    income: toAmountNumber(row.entries),
    expense: toAmountNumber(row.expenses),
  }));
}

function buildMembersGrowthSeries(
  rows: DashboardMembersByMonthResponse[],
): DashboardMembersGrowthPoint[] {
  return rows.map((row) => ({
    monthKey: row.month,
    label: formatMonthLabel(row.month),
    newMembers: row.totalMembers,
  }));
}

function buildOperationalSummary(
  data: DashboardOverviewData,
): DashboardOperationalSummary {
  const currentMembers =
    data.membersGrowthSeries[data.membersGrowthSeries.length - 1]?.newMembers ?? 0;
  const previousMembers =
    data.membersGrowthSeries[data.membersGrowthSeries.length - 2]?.newMembers ?? 0;
  const periodIncome = data.financeSeries.reduce(
    (sum, item) => sum + item.income,
    0,
  );
  const periodExpense = data.financeSeries.reduce(
    (sum, item) => sum + item.expense,
    0,
  );

  return {
    currentMonthMembers: currentMembers,
    previousMonthMembers: previousMembers,
    membersDelta: currentMembers - previousMembers,
    currentMonthIncome: data.metrics.monthlyIncome,
    currentMonthExpense: data.metrics.monthlyExpense,
    currentMonthBalance: data.metrics.monthlyBalance,
    periodIncome,
    periodExpense,
    periodBalance: periodIncome - periodExpense,
  };
}

export async function getDashboardOverviewData(): Promise<DashboardOverviewViewData> {
  ensureApiConfigured();

  const [cardsResponse, financeResponse, membersResponse] = await Promise.all([
    http.get<DashboardCardsResponse>(DASHBOARD_CARDS_ENDPOINT),
    http.get<DashboardFinanceByMonthResponse[]>(DASHBOARD_FINANCE_BY_MONTH_ENDPOINT),
    http.get<DashboardMembersByMonthResponse[]>(
      DASHBOARD_MEMBERS_BY_MONTH_ENDPOINT,
    ),
  ]);

  const financeSeries = buildFinanceSeries(financeResponse.data);
  const membersGrowthSeries = buildMembersGrowthSeries(membersResponse.data);
  const financeMonths = financeResponse.data.map((row) => row.month);
  const currentMonth = financeSeries[financeSeries.length - 1];
  const overviewData: DashboardOverviewData = {
    metrics: {
      totalMembers: cardsResponse.data.totalMembers,
      totalChurches: cardsResponse.data.totalChurches,
      monthlyIncome: toAmountNumber(cardsResponse.data.totalMonthEntries),
      monthlyExpense: toAmountNumber(cardsResponse.data.totalMonthExpenses),
      monthlyBalance: toAmountNumber(cardsResponse.data.monthBalance),
      activeUsers: cardsResponse.data.totalActiveUsers,
    },
    financeSeries,
    membersGrowthSeries,
    currentMonthLabel: currentMonth?.label ?? "",
    financePeriodLabel: buildPeriodLabel(financeMonths),
  };

  return {
    ...overviewData,
    operational: buildOperationalSummary(overviewData),
  };
}
