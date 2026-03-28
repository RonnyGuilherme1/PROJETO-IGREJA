import { Transform, Type } from 'class-transformer';
import { CampaignStatus } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsUUID('4')
  churchId!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  installmentCount!: number;

  @Transform(({ value }) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }

    if (typeof value === 'string') {
      return value.trim().replace(',', '.');
    }

    return value;
  })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'installmentAmount must be a valid decimal with up to 2 decimal places',
  })
  installmentAmount!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
