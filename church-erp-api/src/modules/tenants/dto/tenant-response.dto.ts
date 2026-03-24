import { TenantStatus } from '@prisma/client';

import { TenantThemeKey } from '../constants/tenant-theme.constants';
import { TenantEntity } from '../types/tenant.type';

export class TenantResponseDto {
  id!: string;
  name!: string;
  code!: string;
  status!: TenantStatus;
  logoUrl!: string | null;
  themeKey!: TenantThemeKey;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(tenant: TenantEntity) {
    this.id = tenant.id;
    this.name = tenant.name;
    this.code = tenant.slug;
    this.status = tenant.status;
    this.logoUrl = tenant.logoUrl;
    this.themeKey = tenant.themeKey as TenantThemeKey;
    this.createdAt = tenant.createdAt;
    this.updatedAt = tenant.updatedAt;
  }
}
