import { PlatformRole, UserRole, UserStatus } from '@prisma/client';

import { UserEntity } from '../types/user.type';

export class UserResponseDto {
  id!: string;
  name!: string;
  username!: string | null;
  email!: string | null;
  role!: UserRole;
  status!: UserStatus;
  tenantId!: string | null;
  platformRole!: PlatformRole | null;
  churchId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(user: UserEntity) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.email = user.email;
    this.role = user.role;
    this.status = user.status;
    this.tenantId = user.tenantId;
    this.platformRole = user.platformRole;
    this.churchId = user.churchId;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
