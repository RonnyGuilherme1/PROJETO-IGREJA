import { PlatformRole, UserRole, UserStatus } from '@prisma/client';

import { AuthAccessType } from '../enums/auth-access-type.enum';
import { AuthenticatedUser } from '../types/authenticated-user.type';
import { TenantThemeKey } from '../../tenants/constants/tenant-theme.constants';

class AuthUserTenantDto {
  id!: string;
  name!: string;
  code!: string;
  logoUrl!: string | null;
  themeKey!: TenantThemeKey;
}

export class AuthUserDto {
  id!: string;
  name!: string;
  username!: string | null;
  email!: string | null;
  role!: UserRole;
  status!: UserStatus;
  tenantId!: string | null;
  platformRole!: PlatformRole | null;
  accessType!: AuthAccessType;
  churchId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  tenantCode!: string | null;
  tenantName!: string | null;
  tenantLogoUrl!: string | null;
  tenantThemeKey!: TenantThemeKey | null;
  tenant!: AuthUserTenantDto | null;

  constructor(user: AuthenticatedUser) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.tenantId = user.tenantId;
    this.platformRole = user.platformRole;
    this.accessType = user.platformRole
      ? AuthAccessType.PLATFORM
      : AuthAccessType.TENANT;
    this.churchId = user.churchId;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.tenantCode = user.tenant?.slug ?? null;
    this.tenantName = user.tenant?.name ?? null;
    this.tenantLogoUrl = user.tenant?.logoUrl ?? null;
    this.tenantThemeKey = (user.tenant?.themeKey as TenantThemeKey) ?? null;
    this.tenant = user.tenant
      ? {
          id: user.tenant.id,
          name: user.tenant.name,
          code: user.tenant.slug,
          logoUrl: user.tenant.logoUrl,
          themeKey: user.tenant.themeKey as TenantThemeKey,
        }
      : null;
  }
}
