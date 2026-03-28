import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkCampaignInstallmentPaidDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
