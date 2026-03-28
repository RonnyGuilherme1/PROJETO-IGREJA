import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddCampaignMemberDto {
  @IsUUID('4')
  memberId!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinedAt?: Date | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
