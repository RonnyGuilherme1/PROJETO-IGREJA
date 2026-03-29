export type WhatsappIntegrationProvider = "WHATSAPP_CLOUD_API";
export type WhatsappConnectionStatus =
  | "NOT_CONFIGURED"
  | "PENDING_AUTHORIZATION"
  | "CONNECTED"
  | "ERROR";
export type WhatsappDestinationType = "GROUP" | "PERSON";

export interface WhatsappIntegrationStatusItem {
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  configured: boolean;
  available: boolean;
  connectionStatus: WhatsappConnectionStatus;
  hasAccessToken: boolean;
  hasDestinations: boolean;
  destinationsCount: number;
  fallbackToManual: boolean;
  fallbackMode: "MANUAL";
  missingRequirements: string[];
  summary: string;
}

export interface WhatsappDestinationItem {
  id: string;
  type: WhatsappDestinationType;
  label: string;
  churchId: string | null;
  groupId: string | null;
  phoneNumber: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappIntegrationConfigItem {
  id: string | null;
  provider: WhatsappIntegrationProvider;
  enabled: boolean;
  connectionStatus: WhatsappConnectionStatus;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  requestedPhoneNumber: string | null;
  connectedPhoneDisplay: string | null;
  onboardingState: string | null;
  lastConnectedAt: string | null;
  lastErrorMessage: string | null;
  hasAccessToken: boolean;
  accessTokenMask: string | null;
  fallbackToManual: boolean;
  destinations: WhatsappDestinationItem[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateWhatsappDestinationPayload {
  type: WhatsappDestinationType;
  label: string;
  churchId?: string | null;
  groupId?: string | null;
  phoneNumber?: string | null;
  enabled?: boolean;
}

export interface UpdateWhatsappDestinationPayload {
  type?: WhatsappDestinationType;
  label?: string;
  churchId?: string | null;
  groupId?: string | null;
  phoneNumber?: string | null;
  enabled?: boolean;
}

export interface WhatsappDestinationFormValues {
  type: WhatsappDestinationType;
  label: string;
  churchId: string;
  groupId: string;
  phoneNumber: string;
  enabled: boolean;
}
