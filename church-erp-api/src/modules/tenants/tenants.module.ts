import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TenantsController } from './tenants.controller';
import { PlatformMasterGuard } from './guards/platform-master.guard';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, PlatformMasterGuard],
})
export class TenantsModule {}
