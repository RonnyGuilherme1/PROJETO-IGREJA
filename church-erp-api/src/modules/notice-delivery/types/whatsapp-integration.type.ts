import { Prisma } from '@prisma/client';

export const whatsappIntegrationDestinationSelect =
  Prisma.validator<Prisma.WhatsappIntegrationDestinationSelect>()({
    id: true,
    configId: true,
    churchId: true,
    type: true,
    label: true,
    groupId: true,
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
    connectionStatus: true,
    businessAccountId: true,
    phoneNumberId: true,
    requestedPhoneNumber: true,
    connectedPhoneDisplay: true,
    accessToken: true,
    onboardingState: true,
    lastConnectedAt: true,
    lastErrorMessage: true,
    fallbackToManual: true,
    createdAt: true,
    updatedAt: true,
    destinations: {
      orderBy: [{ createdAt: 'asc' }],
      select: whatsappIntegrationDestinationSelect,
    },
  });

export type WhatsappDestinationEntity =
  Prisma.WhatsappIntegrationDestinationGetPayload<{
    select: typeof whatsappIntegrationDestinationSelect;
  }>;

export type WhatsappIntegrationConfigEntity =
  Prisma.WhatsappIntegrationConfigGetPayload<{
    select: typeof whatsappIntegrationConfigSelect;
  }>;
