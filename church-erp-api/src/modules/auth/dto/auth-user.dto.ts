import { PlatformRole, UserRole, UserStatus } from '@prisma/client';

import { AuthAccessType } from '../enums/auth-access-type.enum';
import { AuthenticatedUser } from '../types/authenticated-user.type';

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
  }
}
