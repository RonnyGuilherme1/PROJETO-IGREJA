import { Transform, Type } from 'class-transformer';
import { NoticeStatus } from '@prisma/client';
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

const NOTICE_IMAGE_URL_PATTERN =
  /^(https?:\/\/[^\s]+|\/api\/uploads\/[^\s]+)$/i;

export class UpdateNoticeDto {
  @IsOptional()
  @IsUUID('4')
  churchId?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  message?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Matches(NOTICE_IMAGE_URL_PATTERN, {
    message:
      'imageUrl deve ser uma URL completa ou um caminho de upload valido.',
  })
  @MaxLength(2000)
  imageUrl?: string | null;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetLabel?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(NoticeStatus)
  status?: NoticeStatus;
}
