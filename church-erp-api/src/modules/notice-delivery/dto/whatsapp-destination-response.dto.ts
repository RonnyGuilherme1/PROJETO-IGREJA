import { WhatsappDestinationType } from '@prisma/client';

import { WhatsappDestinationEntity } from '../types/whatsapp-integration.type';

export class WhatsappDestinationResponseDto {
  id: string;
  type: WhatsappDestinationType;
  label: string;
  churchId: string | null;
  groupId: string | null;
  phoneNumber: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(destination: WhatsappDestinationEntity) {
    this.id = destination.id;
    this.type = destination.type;
    this.label = destination.label;
    this.churchId = destination.churchId ?? null;
    this.groupId = destination.groupId ?? null;
    this.phoneNumber = destination.phoneNumber ?? null;
    this.enabled = destination.enabled;
    this.createdAt = destination.createdAt;
    this.updatedAt = destination.updatedAt;
  }
}
