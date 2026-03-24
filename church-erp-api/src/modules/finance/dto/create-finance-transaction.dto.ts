import { Transform, Type } from 'class-transformer';
import { FinanceType } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFinanceTransactionDto {
  @IsUUID('4')
  churchId!: string;

  @IsUUID('4')
  categoryId!: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toUpperCase();

    if (normalized === 'INCOME') {
      return FinanceType.ENTRY;
    }

    return normalized;
  })
  @IsEnum(FinanceType)
  type!: FinanceType;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  description!: string;

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
    message: 'amount must be a valid decimal with up to 2 decimal places',
  })
  amount!: string;

  @Type(() => Date)
  @IsDate()
  transactionDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
