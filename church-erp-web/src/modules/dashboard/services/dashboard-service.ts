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

export async function getDashboardOverviewData(): Promise<DashboardOverviewData> {
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

  return {
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
}
