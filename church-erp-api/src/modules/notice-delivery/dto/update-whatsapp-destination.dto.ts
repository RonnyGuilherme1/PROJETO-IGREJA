import { Transform, Type } from 'class-transformer';
import { WhatsappDestinationType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export class UpdateWhatsappDestinationDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsEnum(WhatsappDestinationType)
  type?: WhatsappDestinationType;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsUUID()
  churchId?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  groupId?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phoneNumber?: string | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;
}
