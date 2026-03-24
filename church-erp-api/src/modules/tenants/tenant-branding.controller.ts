import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
import { TenantsService } from './tenants.service';

@Controller('tenant/branding')
@UseGuards(JwtAuthGuard)
export class TenantBrandingController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findCurrent(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.findCurrent(currentUser);
  }

  @Patch()
  updateCurrent(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateTenantBrandingDto: UpdateTenantBrandingDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.updateCurrentBranding(
      currentUser,
      updateTenantBrandingDto,
    );
  }
}
