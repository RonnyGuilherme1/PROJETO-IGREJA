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
