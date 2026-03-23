import { PlatformRole, UserRole, UserStatus } from '@prisma/client';

import { AuthAccessType } from '../enums/auth-access-type.enum';

export interface JwtPayload {
  sub: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  tenantId: string | null;
  platformRole: PlatformRole | null;
  accessType: AuthAccessType;
  churchId: string | null;
}
