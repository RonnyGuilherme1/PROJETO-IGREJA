import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PlatformMasterGuard } from '../tenants/guards/platform-master.guard';
import { PlatformUsersController } from './platform-users.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, PlatformUsersController],
  providers: [UsersService, PlatformMasterGuard],
})
export class UsersModule {}
