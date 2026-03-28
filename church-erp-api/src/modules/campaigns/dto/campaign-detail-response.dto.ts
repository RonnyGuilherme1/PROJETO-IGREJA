import { CampaignStatus } from '@prisma/client';

import { CampaignDetailEntity } from '../types/campaign.type';
import { CampaignMemberResponseDto } from './campaign-member-response.dto';

export class CampaignDetailResponseDto {
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
  members!: CampaignMemberResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;

  constructor(campaign: CampaignDetailEntity) {
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
    this.members = campaign.members.map(
      (campaignMember) => new CampaignMemberResponseDto(campaignMember),
    );
    this.createdAt = campaign.createdAt;
    this.updatedAt = campaign.updatedAt;
  }
}
