import {
  WhatsappConnectionStatus,
  WhatsappDestinationType,
  WhatsappIntegrationProvider,
} from '@prisma/client';

export type WhatsappMessageKind = 'text' | 'image';

export interface BuildWhatsappMessagePayloadInput {
  title: string;
  message: string;
  imageUrl?: string | null;
  finalCaption?: string | null;
  destinationType: WhatsappDestinationType;
  groupId?: string | null;
  phoneNumber?: string | null;
}

export interface BuiltWhatsappMessagePayload {
  recipient: string;
  destinationType: WhatsappDestinationType;
  kind: WhatsappMessageKind;
  finalText: string;
  requestBody: Record<string, unknown>;
}

export interface WhatsappProviderConfigInput {
  provider: WhatsappIntegrationProvider;
  connectionStatus: WhatsappConnectionStatus;
  phoneNumberId?: string | null;
  accessToken?: string | null;
}

export interface WhatsappProviderSendResult {
  providerMessageId: string | null;
  responseBody: unknown;
  httpStatus: number;
}
