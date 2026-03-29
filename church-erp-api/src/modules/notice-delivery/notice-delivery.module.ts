import { Module } from '@nestjs/common';

import { MetaWhatsappProviderService } from './meta-whatsapp-provider.service';
import { MetaWhatsappPlatformService } from './meta-whatsapp-platform.service';
import { MetaWhatsappWebhookController } from './meta-whatsapp-webhook.controller';
import { NoticeDeliveryController } from './notice-delivery.controller';
import { NoticeDeliveryService } from './notice-delivery.service';
import { WhatsappIntegrationController } from './whatsapp-integration.controller';
import { WhatsappIntegrationService } from './whatsapp-integration.service';
import { WhatsappDestinationsService } from './whatsapp-destinations.service';
import { WhatsappMessagePayloadBuilderService } from './whatsapp-message-payload-builder.service';

@Module({
  controllers: [
    WhatsappIntegrationController,
    NoticeDeliveryController,
    MetaWhatsappWebhookController,
  ],
  providers: [
    WhatsappIntegrationService,
    WhatsappDestinationsService,
    WhatsappMessagePayloadBuilderService,
    MetaWhatsappProviderService,
    MetaWhatsappPlatformService,
    NoticeDeliveryService,
  ],
  exports: [MetaWhatsappPlatformService],
})
export class NoticeDeliveryModule {}
