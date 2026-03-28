import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkCampaignInstallmentUnpaidDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
