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

export class UpdateFinanceTransactionDto {
  @IsOptional()
  @IsUUID('4')
  churchId?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsEnum(FinanceType)
  type?: FinanceType;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  description?: string;

  @IsOptional()
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
  amount?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  transactionDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
