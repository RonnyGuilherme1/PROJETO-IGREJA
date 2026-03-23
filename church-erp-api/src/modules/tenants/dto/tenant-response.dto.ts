import { TenantStatus } from '@prisma/client';

import { TenantEntity } from '../types/tenant.type';

export class TenantResponseDto {
  id!: string;
  name!: string;
  code!: string;
  status!: TenantStatus;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(tenant: TenantEntity) {
    this.id = tenant.id;
    this.name = tenant.name;
    this.code = tenant.slug;
    this.status = tenant.status;
    this.createdAt = tenant.createdAt;
    this.updatedAt = tenant.updatedAt;
  }
}
