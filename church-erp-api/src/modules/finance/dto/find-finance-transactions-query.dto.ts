import { Transform, Type } from 'class-transformer';
import { FinanceTransactionStatus, FinanceType } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class FindFinanceTransactionsQueryDto {
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  size?: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  perPage?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(FinanceType)
  type?: FinanceType;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(FinanceTransactionStatus)
  status?: FinanceTransactionStatus;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  churchId?: string;
}
