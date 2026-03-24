import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TenantBrandingController } from './tenant-branding.controller';
import { TenantsController } from './tenants.controller';
import { PlatformMasterGuard } from './guards/platform-master.guard';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController, TenantBrandingController],
  providers: [TenantsService, PlatformMasterGuard],
})
export class TenantsModule {}
