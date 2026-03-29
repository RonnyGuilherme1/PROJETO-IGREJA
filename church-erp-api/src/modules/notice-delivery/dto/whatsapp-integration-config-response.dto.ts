import { WhatsappIntegrationProvider } from '@prisma/client';

import { WhatsappIntegrationConfigEntity } from '../types/whatsapp-integration.type';

class WhatsappIntegrationDestinationResponseDto {
  id: string;
  label: string;
  phoneNumber: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    destination: WhatsappIntegrationConfigEntity['destinations'][number],
  ) {
    this.id = destination.id;
    this.label = destination.label;
    this.phoneNumber = destination.phoneNumber;
    this.enabled = destination.enabled;
    this.createdAt = destination.createdAt;
    this.updatedAt = destination.updatedAt;
  }
}

export class WhatsappIntegrationConfigResponseDto {
  id: string | null;
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  hasAccessToken: boolean;
  accessTokenMask: string | null;
  fallbackToManual: boolean;
  destinations: WhatsappIntegrationDestinationResponseDto[];
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(config?: WhatsappIntegrationConfigEntity | null) {
    const normalizedConfig = config ?? null;

    this.id = normalizedConfig?.id ?? null;
    this.provider =
      normalizedConfig?.provider ?? WhatsappIntegrationProvider.WHATSAPP_CLOUD_API;
    this.enabled = normalizedConfig?.enabled ?? false;
    this.businessAccountId = normalizedConfig?.businessAccountId ?? null;
    this.phoneNumberId = normalizedConfig?.phoneNumberId ?? null;
    this.hasAccessToken = Boolean(normalizedConfig?.accessToken);
    this.accessTokenMask = normalizedConfig?.accessToken
      ? this.maskAccessToken(normalizedConfig.accessToken)
      : null;
    this.fallbackToManual = normalizedConfig?.fallbackToManual ?? true;
    this.destinations =
      normalizedConfig?.destinations.map(
        (destination) =>
          new WhatsappIntegrationDestinationResponseDto(destination),
      ) ?? [];
    this.createdAt = normalizedConfig?.createdAt ?? null;
    this.updatedAt = normalizedConfig?.updatedAt ?? null;
  }

  private maskAccessToken(accessToken: string): string {
    const trimmedAccessToken = accessToken.trim();

    if (trimmedAccessToken.length <= 8) {
      return 'Token configurado';
    }

    return `${trimmedAccessToken.slice(0, 4)}...${trimmedAccessToken.slice(-4)}`;
  }
}
