import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ChurchesModule } from './modules/churches/churches.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HealthModule } from './modules/health/health.module';
import { LeadershipRolesModule } from './modules/leadership-roles/leadership-roles.module';
import { MembersModule } from './modules/members/members.module';
import { NoticeDeliveryModule } from './modules/notice-delivery/notice-delivery.module';
import { NoticesModule } from './modules/notices/notices.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import {
  PublicWhatsappOnboardingController,
  TenantWhatsappOnboardingController,
} from './modules/tenants/tenant-whatsapp-onboarding.controller';
import { PlatformMasterGuard } from './modules/tenants/guards/platform-master.guard';
import { TenantWhatsappOnboardingService } from './modules/tenants/tenant-whatsapp-onboarding.service';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CampaignsModule,
    TenantsModule,
    UsersModule,
    ChurchesModule,
    LeadershipRolesModule,
    DepartmentsModule,
    MembersModule,
    NoticeDeliveryModule,
    NoticesModule,
    FinanceModule,
    DashboardModule,
  ],
  controllers: [
    TenantWhatsappOnboardingController,
    PublicWhatsappOnboardingController,
  ],
  providers: [TenantWhatsappOnboardingService, PlatformMasterGuard],
})
export class AppModule {}
