import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateWhatsappDestinationDto } from './create-whatsapp-destination.dto';

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export class UpdateWhatsappIntegrationConfigDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MaxLength(255)
  businessAccountId?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MaxLength(255)
  phoneNumberId?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MaxLength(2048)
  accessToken?: string | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  clearAccessToken?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  fallbackToManual?: boolean;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MaxLength(30)
  requestedPhoneNumber?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateWhatsappDestinationDto)
  destinations?: CreateWhatsappDestinationDto[];
}
