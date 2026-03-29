export type WhatsappIntegrationProvider = "WHATSAPP_CLOUD_API";

export interface WhatsappIntegrationDestinationItem {
  id: string;
  label: string;
  phoneNumber: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappIntegrationConfigItem {
  id: string | null;
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  hasAccessToken: boolean;
  accessTokenMask: string | null;
  fallbackToManual: boolean;
  destinations: WhatsappIntegrationDestinationItem[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WhatsappIntegrationStatusItem {
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  configured: boolean;
  available: boolean;
  hasAccessToken: boolean;
  hasDestinations: boolean;
  destinationsCount: number;
  fallbackToManual: boolean;
  fallbackMode: "MANUAL";
  missingRequirements: string[];
  summary: string;
}

export interface UpdateWhatsappIntegrationDestinationPayload {
  label: string;
  phoneNumber: string;
  enabled: boolean;
}

export interface UpdateWhatsappIntegrationConfigPayload {
  enabled?: boolean;
  businessAccountId?: string | null;
  phoneNumberId?: string | null;
  accessToken?: string | null;
  clearAccessToken?: boolean;
  fallbackToManual?: boolean;
  destinations?: UpdateWhatsappIntegrationDestinationPayload[];
}
