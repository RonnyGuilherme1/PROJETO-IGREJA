import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateWhatsappDestinationDto } from './dto/create-whatsapp-destination.dto';
import { UpdateWhatsappDestinationDto } from './dto/update-whatsapp-destination.dto';
import { UpdateWhatsappIntegrationConfigDto } from './dto/update-whatsapp-integration-config.dto';
import { WhatsappDestinationResponseDto } from './dto/whatsapp-destination-response.dto';
import { WhatsappIntegrationConfigResponseDto } from './dto/whatsapp-integration-config-response.dto';
import { WhatsappIntegrationStatusResponseDto } from './dto/whatsapp-integration-status-response.dto';
import { WhatsappDestinationsService } from './whatsapp-destinations.service';
import { WhatsappIntegrationService } from './whatsapp-integration.service';

@Controller('notice-delivery/whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappIntegrationController {
  constructor(
    private readonly whatsappIntegrationService: WhatsappIntegrationService,
    private readonly whatsappDestinationsService: WhatsappDestinationsService,
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

  @Get('destinations')
  findAllDestinations(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<WhatsappDestinationResponseDto[]> {
    return this.whatsappDestinationsService.findAll(currentUser);
  }

  @Post('destinations')
  createDestination(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createWhatsappDestinationDto: CreateWhatsappDestinationDto,
  ): Promise<WhatsappDestinationResponseDto> {
    return this.whatsappDestinationsService.create(
      currentUser,
      createWhatsappDestinationDto,
    );
  }

  @Patch('destinations/:id')
  updateDestination(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateWhatsappDestinationDto: UpdateWhatsappDestinationDto,
  ): Promise<WhatsappDestinationResponseDto> {
    return this.whatsappDestinationsService.update(
      currentUser,
      id,
      updateWhatsappDestinationDto,
    );
  }

  @Patch('destinations/:id/inactivate')
  inactivateDestination(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<WhatsappDestinationResponseDto> {
    return this.whatsappDestinationsService.inactivate(currentUser, id);
  }
}
