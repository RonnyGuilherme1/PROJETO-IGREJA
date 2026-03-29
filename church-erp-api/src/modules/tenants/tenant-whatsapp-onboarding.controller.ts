import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformMasterGuard } from './guards/platform-master.guard';
import {
  PublicWhatsappOnboardingCallbackResponse,
  TenantWhatsappIntegrationStatusResponse,
  TenantWhatsappOnboardingLinkResponse,
  TenantWhatsappOnboardingService,
} from './tenant-whatsapp-onboarding.service';

class GenerateTenantWhatsappOnboardingLinkDto {
  @IsString()
  @MinLength(10)
  @MaxLength(30)
  requestedPhoneNumber!: string;
}

@Controller('master/tenants')
@UseGuards(JwtAuthGuard, PlatformMasterGuard)
export class TenantWhatsappOnboardingController {
  constructor(
    private readonly tenantWhatsappOnboardingService: TenantWhatsappOnboardingService,
  ) {}

  @Get(':id/whatsapp')
  getStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TenantWhatsappIntegrationStatusResponse> {
    return this.tenantWhatsappOnboardingService.getMasterStatus(id);
  }

  @Post(':id/whatsapp/onboarding-link')
  generateOnboardingLink(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    generateTenantWhatsappOnboardingLinkDto: GenerateTenantWhatsappOnboardingLinkDto,
    @Req() request: Request,
  ): Promise<TenantWhatsappOnboardingLinkResponse> {
    return this.tenantWhatsappOnboardingService.generateOnboardingLink(
      id,
      generateTenantWhatsappOnboardingLinkDto.requestedPhoneNumber,
      this.resolveApiBaseUrl(request),
    );
  }

  private resolveApiBaseUrl(request: Request): string {
    const protocolHeader = request.headers['x-forwarded-proto'];
    const protocol = Array.isArray(protocolHeader)
      ? protocolHeader[0]
      : protocolHeader ?? request.protocol;
    const host = request.get('host');

    if (!host) {
      throw new BadRequestException(
        'Nao foi possivel resolver o host da requisicao.',
      );
    }

    return `${protocol}://${host}/api`;
  }
}

@Controller('public/whatsapp/onboarding')
export class PublicWhatsappOnboardingController {
  constructor(
    private readonly tenantWhatsappOnboardingService: TenantWhatsappOnboardingService,
  ) {}

  @Get('start')
  async start(
    @Res() response: Response,
    @Query('state') state?: string,
  ): Promise<void> {
    // O start publico valida o state salvo e faz o 302 para a URL oficial da Meta.
    const onboardingUrl = await this.tenantWhatsappOnboardingService.startOnboarding(
      state ?? '',
    );

    response.redirect(302, onboardingUrl);
  }

  @Get('callback')
  callback(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<PublicWhatsappOnboardingCallbackResponse> {
    // O callback publico espera state e code para concluir o onboarding oficial da Meta.
    return this.tenantWhatsappOnboardingService.handleCallback(query);
  }
}
