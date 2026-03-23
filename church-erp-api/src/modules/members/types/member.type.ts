import { Prisma } from '@prisma/client';

export const memberSelect = Prisma.validator<Prisma.MemberSelect>()({
  id: true,
  tenantId: true,
  fullName: true,
  birthDate: true,
  gender: true,
  phone: true,
  email: true,
  address: true,
  maritalStatus: true,
  joinedAt: true,
  status: true,
  notes: true,
  churchId: true,
  createdAt: true,
  updatedAt: true,
});

export type MemberEntity = Prisma.MemberGetPayload<{
  select: typeof memberSelect;
}>;
