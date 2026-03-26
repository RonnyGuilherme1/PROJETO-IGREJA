import { Prisma } from '@prisma/client';

export const platformUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  username: true,
  email: true,
  status: true,
  platformRole: true,
  isSystemProtected: true,
  createdByPlatformUserId: true,
  createdAt: true,
  updatedAt: true,
});

export type PlatformUserEntity = Prisma.UserGetPayload<{
  select: typeof platformUserSelect;
}>;
