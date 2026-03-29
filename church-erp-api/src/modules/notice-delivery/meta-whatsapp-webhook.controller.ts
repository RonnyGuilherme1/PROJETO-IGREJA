import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import {
  MetaWhatsappPlatformService,
  MetaWhatsappWebhookAckResponse,
} from './meta-whatsapp-platform.service';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer | string;
}

@Controller('public/whatsapp/webhook')
export class MetaWhatsappWebhookController {
  constructor(
    private readonly metaWhatsappPlatformService: MetaWhatsappPlatformService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  verify(
    @Query() query: Record<string, string | string[] | undefined>,
  ): string {
    return this.metaWhatsappPlatformService.verifyWebhookChallenge(query);
  }

  @Post()
  @HttpCode(200)
  receive(
    @Body() body: unknown,
    @Req() request: RequestWithRawBody,
  ): Promise<MetaWhatsappWebhookAckResponse> {
    return this.metaWhatsappPlatformService.handleWebhookEvent({
      body,
      rawBody: request.rawBody,
      signatureHeader: request.headers['x-hub-signature-256'],
    });
  }
}
