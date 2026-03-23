import { Transform } from 'class-transformer';
import { FinanceType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFinanceCategoryDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsEnum(FinanceType)
  type!: FinanceType;

  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
