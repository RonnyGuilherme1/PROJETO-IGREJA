import { Type } from 'class-transformer';
import { FinanceType } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class FindFinanceTransactionsQueryDto {
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
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  churchId?: string;
}
