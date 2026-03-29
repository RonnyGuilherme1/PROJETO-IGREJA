import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateWhatsappIntegrationConfigDto } from './dto/update-whatsapp-integration-config.dto';
import { WhatsappIntegrationConfigResponseDto } from './dto/whatsapp-integration-config-response.dto';
import { WhatsappIntegrationStatusResponseDto } from './dto/whatsapp-integration-status-response.dto';
import { WhatsappIntegrationService } from './whatsapp-integration.service';

@Controller('notice-delivery/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappIntegrationController {
  constructor(
    private readonly whatsappIntegrationService: WhatsappIntegrationService,
  ) {}

  @Get('status')
  getStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<WhatsappIntegrationStatusResponseDto> {
    return this.whatsappIntegrationService.getStatus(currentUser);
  }

  @Get('config')
  getConfig(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<WhatsappIntegrationConfigResponseDto> {
    return this.whatsappIntegrationService.getConfig(currentUser);
  }

  @Patch('config')
  updateConfig(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateWhatsappIntegrationConfigDto: UpdateWhatsappIntegrationConfigDto,
  ): Promise<WhatsappIntegrationConfigResponseDto> {
    return this.whatsappIntegrationService.updateConfig(
      currentUser,
      updateWhatsappIntegrationConfigDto,
    );
  }
}
