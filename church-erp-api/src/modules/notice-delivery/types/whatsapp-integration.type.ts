import { Prisma } from '@prisma/client';

export const whatsappIntegrationDestinationSelect =
  Prisma.validator<Prisma.WhatsappIntegrationDestinationSelect>()({
    id: true,
    label: true,
    phoneNumber: true,
    enabled: true,
    createdAt: true,
    updatedAt: true,
  });

export const whatsappIntegrationConfigSelect =
  Prisma.validator<Prisma.WhatsappIntegrationConfigSelect>()({
    id: true,
    tenantId: true,
    provider: true,
    enabled: true,
    businessAccountId: true,
    phoneNumberId: true,
    accessToken: true,
    fallbackToManual: true,
    createdAt: true,
    updatedAt: true,
    destinations: {
      orderBy: [{ createdAt: 'asc' }],
      select: whatsappIntegrationDestinationSelect,
    },
  });

export type WhatsappIntegrationConfigEntity =
  Prisma.WhatsappIntegrationConfigGetPayload<{
    select: typeof whatsappIntegrationConfigSelect;
  }>;
