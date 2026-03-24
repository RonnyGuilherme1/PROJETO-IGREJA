import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
import { TenantsService } from './tenants.service';
import { UploadedTenantLogoFile } from './types/uploaded-tenant-logo-file.type';

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

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file?: UploadedTenantLogoFile,
  ): Promise<{ logoUrl: string }> {
    return this.tenantsService.uploadCurrentLogo(currentUser, file);
  }
}
