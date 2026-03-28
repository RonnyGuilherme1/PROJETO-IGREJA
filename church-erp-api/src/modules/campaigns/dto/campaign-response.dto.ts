import { CampaignStatus } from '@prisma/client';

import { CampaignEntity } from '../types/campaign.type';

export class CampaignResponseDto {
  id!: string;
  churchId!: string;
  churchName!: string;
  title!: string;
  description!: string | null;
  installmentCount!: number;
  installmentAmount!: string;
  startDate!: Date | null;
  status!: CampaignStatus;
  membersCount!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(campaign: CampaignEntity) {
    this.id = campaign.id;
    this.churchId = campaign.churchId;
    this.churchName = campaign.church.name;
    this.title = campaign.title;
    this.description = campaign.description;
    this.installmentCount = campaign.installmentCount;
    this.installmentAmount = campaign.installmentAmount.toString();
    this.startDate = campaign.startDate;
    this.status = campaign.status;
    this.membersCount = campaign._count.members;
    this.createdAt = campaign.createdAt;
    this.updatedAt = campaign.updatedAt;
  }
}
