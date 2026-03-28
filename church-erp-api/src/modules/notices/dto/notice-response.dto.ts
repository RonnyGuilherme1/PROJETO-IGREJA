import { NoticeStatus } from '@prisma/client';

import { NoticeEntity } from '../types/notice.type';

export class NoticeResponseDto {
  id!: string;
  churchId!: string | null;
  churchName!: string | null;
  title!: string;
  message!: string;
  imageUrl!: string | null;
  targetLabel!: string | null;
  scheduledAt!: Date | null;
  status!: NoticeStatus;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(notice: NoticeEntity) {
    this.id = notice.id;
    this.churchId = notice.churchId;
    this.churchName = notice.church?.name ?? null;
    this.title = notice.title;
    this.message = notice.message;
    this.imageUrl = notice.imageUrl;
    this.targetLabel = notice.targetLabel;
    this.scheduledAt = notice.scheduledAt;
    this.status = notice.status;
    this.createdAt = notice.createdAt;
    this.updatedAt = notice.updatedAt;
  }
}
