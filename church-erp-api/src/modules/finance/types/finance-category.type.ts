import { Prisma } from '@prisma/client';

export const financeCategorySelect =
  Prisma.validator<Prisma.FinanceCategorySelect>()({
    id: true,
    tenantId: true,
    name: true,
    type: true,
    active: true,
    createdAt: true,
    updatedAt: true,
  });

export type FinanceCategoryEntity = Prisma.FinanceCategoryGetPayload<{
  select: typeof financeCategorySelect;
}>;
