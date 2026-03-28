import { Prisma } from '@prisma/client';

export const leadershipRoleSelect =
  Prisma.validator<Prisma.LeadershipRoleSelect>()({
    id: true,
    tenantId: true,
    name: true,
    description: true,
    active: true,
    createdAt: true,
    updatedAt: true,
  });

export type LeadershipRoleEntity = Prisma.LeadershipRoleGetPayload<{
  select: typeof leadershipRoleSelect;
}>;
