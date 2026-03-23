import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';

import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class PlatformMasterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (
      !user ||
      user.platformRole !== PlatformRole.PLATFORM_ADMIN ||
      user.tenantId !== null
    ) {
      throw new ForbiddenException(
        'Acesso permitido apenas para usuario master da plataforma.',
      );
    }

    return true;
  }
}
