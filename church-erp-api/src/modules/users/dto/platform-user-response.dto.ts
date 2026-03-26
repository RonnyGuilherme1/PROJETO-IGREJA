import { PlatformRole, UserStatus } from '@prisma/client';

import { PlatformUserEntity } from '../types/platform-user.type';

export class PlatformUserResponseDto {
  id!: string;
  name!: string;
  username!: string | null;
  email!: string | null;
  status!: UserStatus;
  platformRole!: PlatformRole;
  isSystemProtected!: boolean;
  createdByPlatformUserId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(user: PlatformUserEntity) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.email = user.email;
    this.status = user.status;
    this.platformRole = user.platformRole!;
    this.isSystemProtected = user.isSystemProtected;
    this.createdByPlatformUserId = user.createdByPlatformUserId;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
