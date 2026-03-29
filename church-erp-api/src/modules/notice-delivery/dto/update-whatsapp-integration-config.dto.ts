import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export class UpdateWhatsappIntegrationDestinationDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  phoneNumber!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;
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
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateWhatsappIntegrationDestinationDto)
  destinations?: UpdateWhatsappIntegrationDestinationDto[];
}
