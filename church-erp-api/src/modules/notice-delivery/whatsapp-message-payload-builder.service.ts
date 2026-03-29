import { BadRequestException, Injectable } from '@nestjs/common';
import { WhatsappDestinationType } from '@prisma/client';

import {
  BuildWhatsappMessagePayloadInput,
  BuiltWhatsappMessagePayload,
} from './types/whatsapp-provider.type';

// Base URL publica usada pela Meta para baixar imagens do aviso.
// Essa configuracao e global da plataforma, nao do tenant comum.
const META_PUBLIC_ASSET_BASE_URL_ENV = 'WHATSAPP_META_PUBLIC_BASE_URL';

@Injectable()
export class WhatsappMessagePayloadBuilderService {
  build(
    input: BuildWhatsappMessagePayloadInput,
  ): BuiltWhatsappMessagePayload {
    const finalText = this.resolveFinalText(input);
    const recipient = this.resolveRecipient(input);

    if (input.imageUrl) {
      const imageUrl = this.normalizePublicImageUrl(input.imageUrl);

      return {
        recipient,
        destinationType: input.destinationType,
        kind: 'image',
        finalText,
        requestBody: {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'image',
          image: {
            link: imageUrl,
            caption: finalText,
          },
        },
      };
    }

    return {
      recipient,
      destinationType: input.destinationType,
      kind: 'text',
      finalText,
      requestBody: {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: {
          body: finalText,
          preview_url: false,
        },
      },
    };
  }

  private resolveFinalText(input: BuildWhatsappMessagePayloadInput): string {
    const overriddenCaption = this.normalizeOptionalString(input.finalCaption);

    if (overriddenCaption) {
      return overriddenCaption;
    }

    const title = this.normalizeOptionalString(input.title);
    const message = this.normalizeOptionalString(input.message);
    const finalText = [title, message].filter(Boolean).join('\n\n');

    if (!finalText) {
      throw new BadRequestException(
        'O aviso nao possui conteudo textual valido para envio.',
      );
    }

    return finalText;
  }

  private resolveRecipient(input: BuildWhatsappMessagePayloadInput): string {
    if (input.destinationType === WhatsappDestinationType.GROUP) {
      const groupId = this.normalizeOptionalString(input.groupId);

      if (!groupId) {
        throw new BadRequestException(
          'Destinos do tipo grupo exigem um groupId valido.',
        );
      }

      return groupId;
    }

    const normalizedPhoneNumber = this.normalizePhoneNumber(input.phoneNumber);

    if (!normalizedPhoneNumber) {
      throw new BadRequestException(
        'Destinos do tipo pessoa exigem um phoneNumber valido em formato internacional.',
      );
    }

    return normalizedPhoneNumber;
  }

  private normalizePublicImageUrl(imageUrl: string): string {
    const normalizedImageUrl = imageUrl.trim();

    if (/^https?:\/\//i.test(normalizedImageUrl)) {
      return normalizedImageUrl;
    }

    if (!normalizedImageUrl.startsWith('/')) {
      throw new BadRequestException(
        'A imagem do aviso precisa estar disponivel em uma URL publica valida para envio pelo WhatsApp.',
      );
    }

    const publicBaseUrl = this.resolvePublicAssetBaseUrl();

    if (!publicBaseUrl) {
      throw new BadRequestException(
        `A imagem do aviso usa caminho relativo. Configure ${META_PUBLIC_ASSET_BASE_URL_ENV} em nivel de plataforma para expor uma URL publica absoluta.`,
      );
    }

    return new URL(normalizedImageUrl, publicBaseUrl).toString();
  }

  private resolvePublicAssetBaseUrl(): string | null {
    const configuredBaseUrl = this.normalizeOptionalString(
      process.env[META_PUBLIC_ASSET_BASE_URL_ENV],
    );

    if (configuredBaseUrl) {
      return configuredBaseUrl.endsWith('/')
        ? configuredBaseUrl
        : `${configuredBaseUrl}/`;
    }

    const firstCorsOrigin = this.normalizeOptionalString(
      process.env.CORS_ORIGIN?.split(',')[0],
    );

    if (!firstCorsOrigin) {
      return null;
    }

    return firstCorsOrigin.endsWith('/') ? firstCorsOrigin : `${firstCorsOrigin}/`;
  }

  private normalizePhoneNumber(phoneNumber?: string | null): string | null {
    if (typeof phoneNumber !== 'string') {
      return null;
    }

    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      return null;
    }

    return digits;
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }
}
