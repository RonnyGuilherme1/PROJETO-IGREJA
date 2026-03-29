import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateWhatsappDestinationPayload,
  UpdateWhatsappDestinationPayload,
  WhatsappDestinationItem,
  WhatsappIntegrationConfigItem,
  WhatsappIntegrationStatusItem,
} from "@/modules/notice-delivery/types/whatsapp";

const WHATSAPP_ENDPOINT = "/notice-delivery/whatsapp";

function sanitizeWhatsappDestinationPayload(
  payload: CreateWhatsappDestinationPayload | UpdateWhatsappDestinationPayload,
) {
  const type = payload.type;
  const sanitizedPayload = {
    type,
    label: payload.label?.trim(),
    churchId:
      "churchId" in payload && payload.churchId !== undefined
        ? payload.churchId?.trim() || null
        : undefined,
    groupId:
      "groupId" in payload && payload.groupId !== undefined
        ? payload.groupId?.trim() || null
        : undefined,
    phoneNumber:
      "phoneNumber" in payload && payload.phoneNumber !== undefined
        ? payload.phoneNumber?.trim() || null
        : undefined,
    enabled: payload.enabled,
  };

  if (type === "GROUP") {
    sanitizedPayload.phoneNumber = null;
  }

  if (type === "PERSON") {
    sanitizedPayload.groupId = null;
  }

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function getWhatsappIntegrationStatus(): Promise<WhatsappIntegrationStatusItem> {
  ensureApiConfigured();

  const response = await http.get<WhatsappIntegrationStatusItem>(
    `${WHATSAPP_ENDPOINT}/status`,
  );

  return response.data;
}

export async function getWhatsappIntegrationConfig(): Promise<WhatsappIntegrationConfigItem> {
  ensureApiConfigured();

  const response = await http.get<WhatsappIntegrationConfigItem>(
    `${WHATSAPP_ENDPOINT}/config`,
  );

  return response.data;
}

export async function listWhatsappDestinations(): Promise<WhatsappDestinationItem[]> {
  ensureApiConfigured();

  const response = await http.get<WhatsappDestinationItem[]>(
    `${WHATSAPP_ENDPOINT}/destinations`,
  );

  return response.data;
}

export async function createWhatsappDestination(
  payload: CreateWhatsappDestinationPayload,
): Promise<WhatsappDestinationItem> {
  ensureApiConfigured();

  const response = await http.post<WhatsappDestinationItem>(
    `${WHATSAPP_ENDPOINT}/destinations`,
    sanitizeWhatsappDestinationPayload(payload),
  );

  return response.data;
}

export async function updateWhatsappDestination(
  id: string,
  payload: UpdateWhatsappDestinationPayload,
): Promise<WhatsappDestinationItem> {
  ensureApiConfigured();

  const response = await http.patch<WhatsappDestinationItem>(
    `${WHATSAPP_ENDPOINT}/destinations/${id}`,
    sanitizeWhatsappDestinationPayload(payload),
  );

  return response.data;
}

export async function inactivateWhatsappDestination(
  id: string,
): Promise<WhatsappDestinationItem> {
  ensureApiConfigured();

  const response = await http.patch<WhatsappDestinationItem>(
    `${WHATSAPP_ENDPOINT}/destinations/${id}/inactivate`,
  );

  return response.data;
}
