import { Transform, Type } from 'class-transformer';
import { TenantStatus } from '@prisma/client';
import {
  IsIn,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CreateTenantAdminUserDto } from './create-tenant-admin-user.dto';
import {
  TENANT_THEME_KEYS,
  TenantThemeKey,
} from '../constants/tenant-theme.constants';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  })
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(TENANT_THEME_KEYS)
  themeKey?: TenantThemeKey;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTenantAdminUserDto)
  adminUser?: CreateTenantAdminUserDto;
}
