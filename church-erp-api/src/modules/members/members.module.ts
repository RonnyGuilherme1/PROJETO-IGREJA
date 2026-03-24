import { Module } from '@nestjs/common';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { TenantMembersController } from './tenant-members.controller';

@Module({
  controllers: [MembersController, TenantMembersController],
  providers: [MembersService],
})
export class MembersModule {}
