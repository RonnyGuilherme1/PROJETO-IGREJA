type FinanceMonthClosureResponseSource = {
  year: number;
  month: number;
  closed: boolean;
  closedAt: Date | null;
  closedByUserId: string | null;
  incomeAmount: { toString(): string };
  expenseAmount: { toString(): string };
  balanceAmount: { toString(): string };
  transactionCount: number;
};

export class FinanceMonthClosureResponseDto {
  year!: number;
  month!: number;
  closed!: boolean;
  closedAt!: Date | null;
  closedByUserId!: string | null;
  incomeAmount!: string;
  expenseAmount!: string;
  balanceAmount!: string;
  transactionCount!: number;

  constructor(data: FinanceMonthClosureResponseSource) {
    this.year = data.year;
    this.month = data.month;
    this.closed = data.closed;
    this.closedAt = data.closedAt;
    this.closedByUserId = data.closedByUserId;
    this.incomeAmount = data.incomeAmount.toString();
    this.expenseAmount = data.expenseAmount.toString();
    this.balanceAmount = data.balanceAmount.toString();
    this.transactionCount = data.transactionCount;
  }
}
