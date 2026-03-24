import { Type } from 'class-transformer';
import { TenantStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { CreateTenantAdminUserDto } from './create-tenant-admin-user.dto';

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
  @ValidateNested()
  @Type(() => CreateTenantAdminUserDto)
  adminUser?: CreateTenantAdminUserDto;
}
