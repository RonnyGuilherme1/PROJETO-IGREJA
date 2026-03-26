import { Prisma } from '@prisma/client';

const baseAuthenticatedUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  status: true,
  tenantId: true,
  platformRole: true,
  isSystemProtected: true,
  churchId: true,
  createdAt: true,
  updatedAt: true,
  tenant: {
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      themeKey: true,
    },
  },
} satisfies Prisma.UserSelect;

export const authenticatedUserSelect =
  Prisma.validator<Prisma.UserSelect>()(baseAuthenticatedUserSelect);

export const userWithCredentialsSelect = Prisma.validator<Prisma.UserSelect>()({
  ...baseAuthenticatedUserSelect,
  passwordHash: true,
});

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof authenticatedUserSelect;
}>;

export type UserWithCredentials = Prisma.UserGetPayload<{
  select: typeof userWithCredentialsSelect;
}>;
