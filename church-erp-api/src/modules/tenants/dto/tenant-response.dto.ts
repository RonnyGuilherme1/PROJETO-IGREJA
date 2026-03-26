import { TenantStatus } from '@prisma/client';

import { TenantThemeKey } from '../constants/tenant-theme.constants';

interface TenantResponseSource {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  logoUrl: string | null;
  themeKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TenantAuditMetadata {
  createdByName?: string | null;
  updatedByName?: string | null;
}

export class TenantResponseDto {
  id!: string;
  name!: string;
  code!: string;
  status!: TenantStatus;
  logoUrl!: string | null;
  themeKey!: TenantThemeKey;
  createdByName!: string | null;
  updatedByName!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(
    tenant: TenantResponseSource,
    auditMetadata: TenantAuditMetadata = {},
  ) {
    this.id = tenant.id;
    this.name = tenant.name;
    this.code = tenant.slug;
    this.status = tenant.status;
    this.logoUrl = tenant.logoUrl;
    this.themeKey = tenant.themeKey as TenantThemeKey;
    this.createdByName = auditMetadata.createdByName ?? null;
    this.updatedByName = auditMetadata.updatedByName ?? null;
    this.createdAt = tenant.createdAt;
    this.updatedAt = tenant.updatedAt;
  }
}
