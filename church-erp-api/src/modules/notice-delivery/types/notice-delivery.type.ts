import { Prisma } from '@prisma/client';

export const noticeDeliverySelect =
  Prisma.validator<Prisma.NoticeDeliverySelect>()({
    id: true,
    tenantId: true,
    noticeId: true,
    destinationId: true,
    channel: true,
    status: true,
    providerMessageId: true,
    sentAt: true,
    errorMessage: true,
    createdAt: true,
    updatedAt: true,
    notice: {
      select: {
        id: true,
        title: true,
      },
    },
    destination: {
      select: {
        id: true,
        label: true,
        type: true,
      },
    },
  });

export type NoticeDeliveryEntity = Prisma.NoticeDeliveryGetPayload<{
  select: typeof noticeDeliverySelect;
}>;
