import { BadRequestException, Injectable } from '@nestjs/common';
import {
  WhatsappConnectionStatus,
  WhatsappIntegrationProvider,
} from '@prisma/client';

import {
  BuiltWhatsappMessagePayload,
  WhatsappProviderConfigInput,
  WhatsappProviderSendResult,
} from './types/whatsapp-provider.type';

const META_GRAPH_API_VERSION = 'v22.0';

@Injectable()
export class MetaWhatsappProviderService {
  async sendMessage(
    config: WhatsappProviderConfigInput,
    payload: BuiltWhatsappMessagePayload,
  ): Promise<WhatsappProviderSendResult> {
    this.ensureConfigIsReady(config);

    return payload.kind === 'image'
      ? this.sendImageMessage(config, payload)
      : this.sendTextMessage(config, payload);
  }

  private async sendTextMessage(
    config: WhatsappProviderConfigInput,
    payload: BuiltWhatsappMessagePayload,
  ): Promise<WhatsappProviderSendResult> {
    return this.executeGraphRequest(config, payload.requestBody);
  }

  private async sendImageMessage(
    config: WhatsappProviderConfigInput,
    payload: BuiltWhatsappMessagePayload,
  ): Promise<WhatsappProviderSendResult> {
    return this.executeGraphRequest(config, payload.requestBody);
  }

  private async executeGraphRequest(
    config: WhatsappProviderConfigInput,
    requestBody: Record<string, unknown>,
  ): Promise<WhatsappProviderSendResult> {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000),
      },
    );
    const responseBody = await this.parseResponseBody(response);

    if (!response.ok) {
      throw new BadRequestException(
        this.buildProviderErrorMessage(response.status, responseBody),
      );
    }

    return {
      providerMessageId: this.extractProviderMessageId(responseBody),
      responseBody,
      httpStatus: response.status,
    };
  }

  private ensureConfigIsReady(config: WhatsappProviderConfigInput): void {
    if (config.provider !== WhatsappIntegrationProvider.WHATSAPP_CLOUD_API) {
      throw new BadRequestException(
        'O provider configurado para WhatsApp ainda nao e suportado.',
      );
    }

    if (config.connectionStatus !== WhatsappConnectionStatus.CONNECTED) {
      throw new BadRequestException(
        'A integracao do WhatsApp nao esta conectada para envio oficial.',
      );
    }

    if (!this.normalizeOptionalString(config.phoneNumberId)) {
      throw new BadRequestException(
        'A integracao do WhatsApp precisa de um phoneNumberId valido para envio.',
      );
    }

    if (!this.normalizeOptionalString(config.accessToken)) {
      throw new BadRequestException(
        'A integracao do WhatsApp precisa de um accessToken valido para envio.',
      );
    }
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText) as unknown;
    } catch {
      return responseText;
    }
  }

  private buildProviderErrorMessage(
    statusCode: number,
    responseBody: unknown,
  ): string {
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'error' in responseBody &&
      responseBody.error &&
      typeof responseBody.error === 'object'
    ) {
      const error = responseBody.error as {
        error_user_title?: unknown;
        error_user_msg?: unknown;
        message?: unknown;
        error_data?: { details?: unknown } | null;
        code?: unknown;
      };
      const details = [
        typeof error.error_user_title === 'string'
          ? error.error_user_title
          : null,
        typeof error.error_user_msg === 'string' ? error.error_user_msg : null,
        typeof error.message === 'string' ? error.message : null,
        error.error_data &&
        typeof error.error_data === 'object' &&
        typeof error.error_data.details === 'string'
          ? error.error_data.details
          : null,
        typeof error.code === 'number' || typeof error.code === 'string'
          ? `codigo ${error.code}`
          : null,
      ]
        .filter(Boolean)
        .join(' - ');

      return details || 'Falha no envio pelo provider oficial do WhatsApp.';
    }

    return `Falha no envio pelo provider oficial do WhatsApp. Codigo HTTP ${statusCode}.`;
  }

  private extractProviderMessageId(responseBody: unknown): string | null {
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'messages' in responseBody &&
      Array.isArray(responseBody.messages)
    ) {
      const firstMessage = responseBody.messages[0];

      if (
        firstMessage &&
        typeof firstMessage === 'object' &&
        'id' in firstMessage &&
        typeof firstMessage.id === 'string'
      ) {
        return firstMessage.id;
      }
    }

    return null;
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }
}
