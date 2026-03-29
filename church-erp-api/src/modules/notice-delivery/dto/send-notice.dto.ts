import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export class SendNoticeDto {
  @IsUUID()
  destinationId!: string;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableString(value))
  @IsString()
  @MaxLength(4096)
  finalCaption?: string | null;
}
