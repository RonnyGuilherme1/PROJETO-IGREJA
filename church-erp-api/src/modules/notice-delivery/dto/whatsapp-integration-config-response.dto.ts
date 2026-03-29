import {
  WhatsappConnectionStatus,
  WhatsappIntegrationProvider,
} from '@prisma/client';

import { WhatsappDestinationResponseDto } from './whatsapp-destination-response.dto';
import { WhatsappIntegrationConfigEntity } from '../types/whatsapp-integration.type';

export class WhatsappIntegrationConfigResponseDto {
  id: string | null;
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  connectionStatus: WhatsappConnectionStatus;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  requestedPhoneNumber: string | null;
  connectedPhoneDisplay: string | null;
  onboardingState: string | null;
  lastConnectedAt: Date | null;
  lastErrorMessage: string | null;
  hasAccessToken: boolean;
  accessTokenMask: string | null;
  fallbackToManual: boolean;
  destinations: WhatsappDestinationResponseDto[];
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(config?: WhatsappIntegrationConfigEntity | null) {
    const normalizedConfig = config ?? null;

    this.id = normalizedConfig?.id ?? null;
    this.provider =
      normalizedConfig?.provider ?? WhatsappIntegrationProvider.WHATSAPP_CLOUD_API;
    this.enabled = normalizedConfig?.enabled ?? false;
    this.connectionStatus =
      normalizedConfig?.connectionStatus ??
      WhatsappConnectionStatus.NOT_CONFIGURED;
    this.businessAccountId = normalizedConfig?.businessAccountId ?? null;
    this.phoneNumberId = normalizedConfig?.phoneNumberId ?? null;
    this.requestedPhoneNumber = normalizedConfig?.requestedPhoneNumber ?? null;
    this.connectedPhoneDisplay =
      normalizedConfig?.connectedPhoneDisplay ?? null;
    this.onboardingState = normalizedConfig?.onboardingState ?? null;
    this.lastConnectedAt = normalizedConfig?.lastConnectedAt ?? null;
    this.lastErrorMessage = normalizedConfig?.lastErrorMessage ?? null;
    this.hasAccessToken = Boolean(normalizedConfig?.accessToken);
    this.accessTokenMask = normalizedConfig?.accessToken
      ? this.maskAccessToken(normalizedConfig.accessToken)
      : null;
    this.fallbackToManual = normalizedConfig?.fallbackToManual ?? true;
    this.destinations =
      normalizedConfig?.destinations.map(
        (destination) => new WhatsappDestinationResponseDto(destination),
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
