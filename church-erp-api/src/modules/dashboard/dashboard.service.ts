import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ChurchStatus,
  MemberStatus,
  Prisma,
  UserStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DashboardCardsDto } from './dto/dashboard-cards.dto';
import { DashboardFinanceByMonthDto } from './dto/dashboard-finance-by-month.dto';
import { DashboardMembersByMonthDto } from './dto/dashboard-members-by-month.dto';

type FinanceByMonthRow = {
  month: string;
  entries: Prisma.Decimal | string | number | null;
  expenses: Prisma.Decimal | string | number | null;
};

type MembersByMonthRow = {
  month: string;
  total: number | string;
};

type DashboardMonthFinanceTotalsRow = {
  entries: Prisma.Decimal | string | number | null;
  expenses: Prisma.Decimal | string | number | null;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards(currentUser: AuthenticatedUser): Promise<DashboardCardsDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const { start, end } = this.getCurrentMonthRange();

    const [
      totalMembers,
      totalChurches,
      totalActiveUsers,
      monthFinanceTotals,
    ] = await Promise.all([
      this.prisma.member.count({
        where: {
          tenantId,
          status: MemberStatus.ACTIVE,
        },
      }),
      this.prisma.church.count({
        where: {
          tenantId,
          status: ChurchStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          tenantId,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.$queryRaw<DashboardMonthFinanceTotalsRow[]>(Prisma.sql`
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN "type" = 'ENTRY' THEN "amount"
                ELSE 0
              END
            ),
            0
          ) AS entries,
          COALESCE(
            SUM(
              CASE
                WHEN "type" = 'EXPENSE' THEN "amount"
                ELSE 0
              END
            ),
            0
          ) AS expenses
        FROM "FinanceTransaction"
        WHERE "tenantId" = ${tenantId}::uuid
          AND "status" = 'ACTIVE'
          AND "transactionDate" >= ${start}
          AND "transactionDate" < ${end}
      `),
    ]);
    const [monthFinanceSummary] = monthFinanceTotals;

    const totalMonthEntries = this.toDecimalString(monthFinanceSummary?.entries);
    const totalMonthExpenses = this.toDecimalString(
      monthFinanceSummary?.expenses,
    );
    const monthBalance = new Prisma.Decimal(totalMonthEntries)
      .minus(new Prisma.Decimal(totalMonthExpenses))
      .toFixed(2);

    return new DashboardCardsDto({
      totalMembers,
      totalChurches,
      totalMonthEntries,
      totalMonthExpenses,
      monthBalance,
      totalActiveUsers,
    });
  }

  async getFinanceByMonth(
    currentUser: AuthenticatedUser,
  ): Promise<DashboardFinanceByMonthDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const { start, end } = this.getCurrentYearRange();
    const months = this.getMonthKeysBetween(start, end);

    const rows = await this.prisma.$queryRaw<FinanceByMonthRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "transactionDate"), 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN type = 'ENTRY' THEN amount ELSE 0 END), 0) AS entries,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expenses
      FROM "FinanceTransaction"
      WHERE "status" = 'ACTIVE'
        AND "tenantId" = ${tenantId}::uuid
        AND "transactionDate" >= ${start}
        AND "transactionDate" < ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    const rowsByMonth = new Map(
      rows.map((row) => [
        row.month,
        {
          entries: this.toDecimalString(row.entries),
          expenses: this.toDecimalString(row.expenses),
        },
      ]),
    );

    return months.map((month) => {
      const values = rowsByMonth.get(month) ?? {
        entries: '0.00',
        expenses: '0.00',
      };

      return new DashboardFinanceByMonthDto({
        month,
        entries: values.entries,
        expenses: values.expenses,
        balance: new Prisma.Decimal(values.entries)
          .minus(new Prisma.Decimal(values.expenses))
          .toFixed(2),
      });
    });
  }

  async getMembersByMonth(
    currentUser: AuthenticatedUser,
  ): Promise<DashboardMembersByMonthDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const { start, end } = this.getCurrentYearRange();
    const months = this.getMonthKeysBetween(start, end);

    const rows = await this.prisma.$queryRaw<MembersByMonthRow[]>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::int AS total
      FROM "Member"
      WHERE "tenantId" = ${tenantId}::uuid
        AND "createdAt" >= ${start}
        AND "createdAt" < ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    const rowsByMonth = new Map(
      rows.map((row) => [row.month, Number(row.total)]),
    );

    return months.map(
      (month) =>
        new DashboardMembersByMonthDto({
          month,
          totalMembers: rowsByMonth.get(month) ?? 0,
        }),
    );
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }
  }

  private ensureTenantAccess(currentUser: AuthenticatedUser): string {
    if (!currentUser.tenantId) {
      throw new ForbiddenException(
        'Acesso permitido apenas para usuarios vinculados a um tenant.',
      );
    }

    return currentUser.tenantId;
  }

  private getCurrentMonthRange(): { start: Date; end: Date } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    return {
      start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)),
    };
  }

  private getCurrentYearRange(): { start: Date; end: Date } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    return {
      start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0)),
    };
  }

  private getMonthKeysBetween(start: Date, end: Date): string[] {
    const months: string[] = [];
    const cursor = new Date(start);

    while (cursor < end) {
      months.push(this.toMonthKey(cursor));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return months;
  }

  private toMonthKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  }

  private toDecimalString(
    value: Prisma.Decimal | string | number | null | undefined,
  ): string {
    if (value === null || value === undefined) {
      return '0.00';
    }

    return new Prisma.Decimal(value).toFixed(2);
  }
}
