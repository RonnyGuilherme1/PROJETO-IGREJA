export class DashboardCardsDto {
  totalMembers!: number;
  totalChurches!: number;
  totalMonthEntries!: string;
  totalMonthExpenses!: string;
  monthBalance!: string;
  totalActiveUsers!: number;

  constructor(data: DashboardCardsDto) {
    this.totalMembers = data.totalMembers;
    this.totalChurches = data.totalChurches;
    this.totalMonthEntries = data.totalMonthEntries;
    this.totalMonthExpenses = data.totalMonthExpenses;
    this.monthBalance = data.monthBalance;
    this.totalActiveUsers = data.totalActiveUsers;
  }
}
