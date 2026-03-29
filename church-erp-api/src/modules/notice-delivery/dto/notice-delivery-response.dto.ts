import {
  NoticeDeliveryStatus,
  WhatsappDestinationType,
} from '@prisma/client';

import { NoticeDeliveryEntity } from '../types/notice-delivery.type';

export class NoticeDeliveryResponseDto {
  id: string;
  noticeId: string;
  noticeTitle: string;
  destinationId: string;
  destinationLabel: string;
  destinationType: WhatsappDestinationType;
  channel: string;
  status: NoticeDeliveryStatus;
  success: boolean;
  providerMessageId: string | null;
  sentAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  message: string;

  constructor(delivery: NoticeDeliveryEntity) {
    this.id = delivery.id;
    this.noticeId = delivery.noticeId;
    this.noticeTitle = delivery.notice.title;
    this.destinationId = delivery.destinationId;
    this.destinationLabel = delivery.destination.label;
    this.destinationType = delivery.destination.type;
    this.channel = delivery.channel;
    this.status = delivery.status;
    this.success = delivery.status === NoticeDeliveryStatus.SENT;
    this.providerMessageId = delivery.providerMessageId ?? null;
    this.sentAt = delivery.sentAt ?? null;
    this.errorMessage = delivery.errorMessage ?? null;
    this.createdAt = delivery.createdAt;
    this.updatedAt = delivery.updatedAt;
    this.message =
      delivery.status === NoticeDeliveryStatus.SENT
        ? 'Aviso enviado com sucesso para o destino selecionado.'
        : delivery.errorMessage ??
          'Nao foi possivel enviar o aviso para o destino selecionado.';
  }
}
