import { Prisma } from '@prisma/client';

export const tenantSelect = Prisma.validator<Prisma.TenantSelect>()({
  id: true,
  name: true,
  slug: true,
  status: true,
  logoUrl: true,
  themeKey: true,
  createdAt: true,
  updatedAt: true,
});

export type TenantEntity = Prisma.TenantGetPayload<{
  select: typeof tenantSelect;
}>;
