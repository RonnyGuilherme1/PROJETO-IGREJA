import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class FinanceMonthReferenceDto {
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(2000)
  @Max(9999)
  year!: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
