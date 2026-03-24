import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TenantUsersController } from './tenant-users.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, TenantUsersController],
  providers: [UsersService],
})
export class UsersModule {}
