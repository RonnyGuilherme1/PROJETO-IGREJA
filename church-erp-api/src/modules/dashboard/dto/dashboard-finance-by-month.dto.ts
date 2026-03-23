export class DashboardFinanceByMonthDto {
  month!: string;
  entries!: string;
  expenses!: string;
  balance!: string;

  constructor(data: DashboardFinanceByMonthDto) {
    this.month = data.month;
    this.entries = data.entries;
    this.expenses = data.expenses;
    this.balance = data.balance;
  }
}
