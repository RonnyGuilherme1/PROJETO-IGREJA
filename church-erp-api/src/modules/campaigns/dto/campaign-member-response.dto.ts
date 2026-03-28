import { CampaignMemberEntity } from '../types/campaign.type';
import { CampaignInstallmentResponseDto } from './campaign-installment-response.dto';

export class CampaignMemberResponseDto {
  id!: string;
  campaignId!: string;
  memberId!: string;
  memberName!: string;
  joinedAt!: Date;
  notes!: string | null;
  installments!: CampaignInstallmentResponseDto[];

  constructor(campaignMember: CampaignMemberEntity) {
    this.id = campaignMember.id;
    this.campaignId = campaignMember.campaignId;
    this.memberId = campaignMember.memberId;
    this.memberName = campaignMember.member.fullName;
    this.joinedAt = campaignMember.joinedAt;
    this.notes = campaignMember.notes;
    this.installments = campaignMember.installments.map(
      (installment) => new CampaignInstallmentResponseDto(installment),
    );
  }
}
