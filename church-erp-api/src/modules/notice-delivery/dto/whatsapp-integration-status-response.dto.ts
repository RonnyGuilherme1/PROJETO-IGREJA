import {
  WhatsappConnectionStatus,
  WhatsappIntegrationProvider,
} from '@prisma/client';

interface WhatsappIntegrationStatusResponseDtoParams {
  provider?: WhatsappIntegrationProvider;
  enabled: boolean;
  configured: boolean;
  available: boolean;
  connectionStatus: WhatsappConnectionStatus;
  hasAccessToken: boolean;
  hasDestinations: boolean;
  destinationsCount: number;
  fallbackToManual: boolean;
  missingRequirements: string[];
  summary: string;
}

export class WhatsappIntegrationStatusResponseDto {
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  configured: boolean;
  available: boolean;
  connectionStatus: WhatsappConnectionStatus;
  hasAccessToken: boolean;
  hasDestinations: boolean;
  destinationsCount: number;
  fallbackToManual: boolean;
  fallbackMode: 'MANUAL';
  missingRequirements: string[];
  summary: string;

  constructor({
    provider = WhatsappIntegrationProvider.WHATSAPP_CLOUD_API,
    enabled,
    configured,
    available,
    connectionStatus,
    hasAccessToken,
    hasDestinations,
    destinationsCount,
    fallbackToManual,
    missingRequirements,
    summary,
  }: WhatsappIntegrationStatusResponseDtoParams) {
    this.provider = provider;
    this.enabled = enabled;
    this.configured = configured;
    this.available = available;
    this.connectionStatus = connectionStatus;
    this.hasAccessToken = hasAccessToken;
    this.hasDestinations = hasDestinations;
    this.destinationsCount = destinationsCount;
    this.fallbackToManual = fallbackToManual;
    this.fallbackMode = 'MANUAL';
    this.missingRequirements = missingRequirements;
    this.summary = summary;
  }
}
