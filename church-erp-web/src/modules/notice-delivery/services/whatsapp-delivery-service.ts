import { ensureApiConfigured, http } from "@/lib/http";
import type {
  UpdateWhatsappIntegrationConfigPayload,
  WhatsappIntegrationConfigItem,
  WhatsappIntegrationStatusItem,
} from "@/modules/notice-delivery/types/whatsapp-delivery";

const WHATSAPP_DELIVERY_ENDPOINT = "/notice-delivery/whatsapp";

function sanitizeWhatsappIntegrationPayload(
  payload: UpdateWhatsappIntegrationConfigPayload,
) {
  const sanitizedPayload = {
    enabled: payload.enabled,
    businessAccountId:
      payload.businessAccountId !== undefined
        ? payload.businessAccountId?.trim() || null
        : undefined,
    phoneNumberId:
      payload.phoneNumberId !== undefined
        ? payload.phoneNumberId?.trim() || null
        : undefined,
    accessToken:
      payload.accessToken !== undefined
        ? payload.accessToken?.trim() || null
        : undefined,
    clearAccessToken: payload.clearAccessToken,
    fallbackToManual: payload.fallbackToManual,
    destinations:
      payload.destinations?.map((destination) => ({
        label: destination.label.trim(),
        phoneNumber: destination.phoneNumber.trim(),
        enabled: destination.enabled,
      })) ?? undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function getWhatsappIntegrationStatus(): Promise<WhatsappIntegrationStatusItem> {
  ensureApiConfigured();

  const response = await http.get<WhatsappIntegrationStatusItem>(
    `${WHATSAPP_DELIVERY_ENDPOINT}/status`,
  );

  return response.data;
}

export async function getWhatsappIntegrationConfig(): Promise<WhatsappIntegrationConfigItem> {
  ensureApiConfigured();

  const response = await http.get<WhatsappIntegrationConfigItem>(
    `${WHATSAPP_DELIVERY_ENDPOINT}/config`,
  );

  return response.data;
}

export async function updateWhatsappIntegrationConfig(
  payload: UpdateWhatsappIntegrationConfigPayload,
): Promise<WhatsappIntegrationConfigItem> {
  ensureApiConfigured();

  const response = await http.patch<WhatsappIntegrationConfigItem>(
    `${WHATSAPP_DELIVERY_ENDPOINT}/config`,
    sanitizeWhatsappIntegrationPayload(payload),
  );

  return response.data;
}
