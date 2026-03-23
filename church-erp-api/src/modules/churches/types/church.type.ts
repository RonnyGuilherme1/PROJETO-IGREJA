import { Prisma } from '@prisma/client';

export const churchSelect = Prisma.validator<Prisma.ChurchSelect>()({
  id: true,
  tenantId: true,
  name: true,
  cnpj: true,
  phone: true,
  email: true,
  address: true,
  pastorName: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
});

export type ChurchEntity = Prisma.ChurchGetPayload<{
  select: typeof churchSelect;
}>;
