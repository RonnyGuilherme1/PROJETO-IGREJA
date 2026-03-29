import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateNoticePayload,
  NoticeDeliveryResult,
  NoticeImageUploadResponse,
  NoticeItem,
  NoticeListResult,
  SendNoticePayload,
  UpdateNoticePayload,
} from "@/modules/notices/types/notices";

const NOTICES_ENDPOINT = "/notices";
const NOTICE_DELIVERY_ENDPOINT = "/notice-delivery/notices";
const NOTICE_IMAGE_UPLOAD_FIELD = "image";

function sanitizeNoticePayload(
  payload: CreateNoticePayload | UpdateNoticePayload,
) {
  const sanitizedPayload = {
    ...payload,
    churchId:
      "churchId" in payload && payload.churchId !== undefined
        ? payload.churchId?.trim() || null
        : undefined,
    title:
      "title" in payload && payload.title !== undefined
        ? payload.title.trim()
        : undefined,
    message:
      "message" in payload && payload.message !== undefined
        ? payload.message.trim()
        : undefined,
    imageUrl:
      "imageUrl" in payload && payload.imageUrl !== undefined
        ? payload.imageUrl?.trim() || null
        : undefined,
    targetLabel:
      "targetLabel" in payload && payload.targetLabel !== undefined
        ? payload.targetLabel?.trim() || null
        : undefined,
    scheduledAt:
      "scheduledAt" in payload && payload.scheduledAt !== undefined
        ? payload.scheduledAt?.trim() || null
        : undefined,
    status: payload.status,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listNotices(): Promise<NoticeListResult> {
  ensureApiConfigured();

  const response = await http.get<NoticeItem[]>(NOTICES_ENDPOINT);

  return {
    items: response.data,
    total: response.data.length,
  };
}

export async function getNoticeById(id: string): Promise<NoticeItem> {
  ensureApiConfigured();

  const response = await http.get<NoticeItem>(`${NOTICES_ENDPOINT}/${id}`);
  return response.data;
}

export async function createNotice(
  payload: CreateNoticePayload,
): Promise<NoticeItem> {
  ensureApiConfigured();

  const response = await http.post<NoticeItem>(
    NOTICES_ENDPOINT,
    sanitizeNoticePayload(payload),
  );

  return response.data;
}

export async function updateNotice(
  id: string,
  payload: UpdateNoticePayload,
): Promise<NoticeItem> {
  ensureApiConfigured();

  const response = await http.patch<NoticeItem>(
    `${NOTICES_ENDPOINT}/${id}`,
    sanitizeNoticePayload(payload),
  );

  return response.data;
}

export async function uploadNoticeImage(
  id: string,
  file: File,
): Promise<NoticeImageUploadResponse> {
  ensureApiConfigured();

  const formData = new FormData();
  formData.append(NOTICE_IMAGE_UPLOAD_FIELD, file);

  const response = await http.postForm<NoticeImageUploadResponse>(
    `${NOTICES_ENDPOINT}/${id}/image`,
    formData,
  );

  return response.data;
}

export async function sendNotice(
  id: string,
  payload: SendNoticePayload,
): Promise<NoticeDeliveryResult> {
  ensureApiConfigured();

  const response = await http.post<NoticeDeliveryResult>(
    `${NOTICE_DELIVERY_ENDPOINT}/${id}/send`,
    {
      destinationId: payload.destinationId,
      finalCaption: payload.finalCaption?.trim() || undefined,
    },
  );

  return response.data;
}
