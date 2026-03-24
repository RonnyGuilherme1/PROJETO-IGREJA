import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  TENANT_THEME_KEYS,
  TenantThemeKey,
} from '../constants/tenant-theme.constants';

export class UpdateTenantBrandingDto {
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
}
