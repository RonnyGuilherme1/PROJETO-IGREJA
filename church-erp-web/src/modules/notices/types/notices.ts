export type NoticeStatus = "DRAFT" | "READY" | "SENT";
export type NoticeDeliveryStatus = "PENDING" | "SENT" | "FAILED";

export interface NoticeItem {
  id: string;
  churchId: string | null;
  churchName: string | null;
  title: string;
  message: string;
  imageUrl: string | null;
  targetLabel: string | null;
  scheduledAt: string | null;
  status: NoticeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeListResult {
  items: NoticeItem[];
  total: number;
}

export interface CreateNoticePayload {
  churchId: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  targetLabel: string;
  scheduledAt: string;
  status: NoticeStatus;
}

export interface UpdateNoticePayload {
  churchId?: string | null;
  title?: string;
  message?: string;
  imageUrl?: string | null;
  targetLabel?: string | null;
  scheduledAt?: string | null;
  status?: NoticeStatus;
}

export interface NoticeFormValues {
  churchId: string;
  title: string;
  message: string;
  imageUrl: string;
  targetLabel: string;
  scheduledAt: string;
  status: NoticeStatus;
}

export interface NoticeImageUploadResponse {
  imageUrl: string;
}

export interface SendNoticePayload {
  destinationId: string;
  finalCaption?: string | null;
}

export interface NoticeDeliveryResult {
  id: string;
  noticeId: string;
  noticeTitle: string;
  destinationId: string;
  destinationLabel: string;
  destinationType: "GROUP" | "PERSON";
  channel: string;
  status: NoticeDeliveryStatus;
  success: boolean;
  providerMessageId: string | null;
  sentAt: string | null;
  errorMessage: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTICE_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "READY", label: "Pronto" },
  { value: "SENT", label: "Enviado" },
] as const;
