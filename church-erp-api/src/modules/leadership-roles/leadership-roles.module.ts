import { Module } from '@nestjs/common';

import { LeadershipRolesController } from './leadership-roles.controller';
import { LeadershipRolesService } from './leadership-roles.service';

@Module({
  controllers: [LeadershipRolesController],
  providers: [LeadershipRolesService],
})
export class LeadershipRolesModule {}
