import { Prisma } from '@prisma/client';

export const userSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  status: true,
  tenantId: true,
  platformRole: true,
  churchId: true,
  createdAt: true,
  updatedAt: true,
});

export type UserEntity = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;
