import { CampaignInstallmentStatus } from '@prisma/client';

import { CampaignInstallmentEntity } from '../types/campaign.type';

export class CampaignInstallmentResponseDto {
  id!: string;
  campaignMemberId!: string;
  installmentNumber!: number;
  amount!: string;
  dueDate!: Date | null;
  status!: CampaignInstallmentStatus;
  paidAt!: Date | null;
  notes!: string | null;

  constructor(installment: CampaignInstallmentEntity) {
    this.id = installment.id;
    this.campaignMemberId = installment.campaignMemberId;
    this.installmentNumber = installment.installmentNumber;
    this.amount = installment.amount.toString();
    this.dueDate = installment.dueDate;
    this.status = installment.status;
    this.paidAt = installment.paidAt;
    this.notes = installment.notes;
  }
}
