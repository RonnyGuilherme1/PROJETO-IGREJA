export interface DashboardCardsResponse {
  totalMembers: number;
  totalChurches: number;
  totalMonthEntries: string;
  totalMonthExpenses: string;
  monthBalance: string;
  totalActiveUsers: number;
}

export interface DashboardFinanceByMonthResponse {
  month: string;
  entries: string;
  expenses: string;
  balance: string;
}

export interface DashboardMembersByMonthResponse {
  month: string;
  totalMembers: number;
}

export interface DashboardMetrics {
  totalMembers: number;
  totalChurches: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  activeUsers: number;
}

export interface DashboardFinancePoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
}

export interface DashboardMembersGrowthPoint {
  monthKey: string;
  label: string;
  newMembers: number;
}

export interface DashboardOverviewData {
  metrics: DashboardMetrics;
  financeSeries: DashboardFinancePoint[];
  membersGrowthSeries: DashboardMembersGrowthPoint[];
  currentMonthLabel: string;
  financePeriodLabel: string;
  membersPeriodLabel: string;
}
