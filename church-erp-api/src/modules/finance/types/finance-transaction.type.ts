import { Prisma } from '@prisma/client';

export const financeTransactionSelect =
  Prisma.validator<Prisma.FinanceTransactionSelect>()({
    id: true,
    tenantId: true,
    churchId: true,
    categoryId: true,
    type: true,
    description: true,
    amount: true,
    transactionDate: true,
    notes: true,
    status: true,
    createdByUserId: true,
    createdAt: true,
    updatedAt: true,
  });

export type FinanceTransactionEntity = Prisma.FinanceTransactionGetPayload<{
  select: typeof financeTransactionSelect;
}>;
