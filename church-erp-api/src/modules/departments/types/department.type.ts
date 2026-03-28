import { Prisma } from '@prisma/client';

export const departmentSelect = Prisma.validator<Prisma.DepartmentSelect>()({
  id: true,
  tenantId: true,
  name: true,
  description: true,
  active: true,
  createdAt: true,
  updatedAt: true,
});

export type DepartmentEntity = Prisma.DepartmentGetPayload<{
  select: typeof departmentSelect;
}>;
