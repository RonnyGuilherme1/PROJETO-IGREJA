import { Prisma } from '@prisma/client';

export const noticeSelect = Prisma.validator<Prisma.NoticeSelect>()({
  id: true,
  tenantId: true,
  churchId: true,
  title: true,
  message: true,
  imageUrl: true,
  targetLabel: true,
  scheduledAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  church: {
    select: {
      id: true,
      name: true,
    },
  },
});

export type NoticeEntity = Prisma.NoticeGetPayload<{
  select: typeof noticeSelect;
}>;
