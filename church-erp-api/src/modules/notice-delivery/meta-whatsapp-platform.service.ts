import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { NoticeDeliveryStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';

import { PrismaService } from '../../database/prisma/prisma.service';

const META_GRAPH_API_VERSION = 'v22.0';
const META_GRAPH_API_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;
// Segredos e tokens abaixo pertencem a configuracao global da plataforma.
// Eles nunca devem ser editaveis por tenants comuns.
const META_WEBHOOK_VERIFY_TOKEN_ENV = 'WHATSAPP_META_WEBHOOK_VERIFY_TOKEN';
const META_APP_ID_ENV = 'WHATSAPP_META_APP_ID';
const META_APP_SECRET_ENV = 'WHATSAPP_META_APP_SECRET';

interface MetaGraphTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface MetaGraphDebugTokenResponse {
  data?: {
    granular_scopes?: Array<{
      scope?: string;
      target_ids?: Array<string | number>;
    }>;
  };
}

interface MetaGraphPhoneNumbersResponse {
  data?: Array<{
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
  }>;
}

interface MetaWebhookStatusError {
  code?: number;
  title?: string;
  message?: string;
  details?: string;
  error_data?: {
    details?: string;
  };
}

interface MetaWebhookStatusEvent {
  providerMessageId: string | null;
  status: string | null;
  timestamp: Date | null;
  errors: MetaWebhookStatusError[];
}

export interface MetaWhatsappWebhookAckResponse {
  received: true;
  updatedDeliveries: number;
  ignoredStatuses: number;
}

export interface MetaWhatsappOnboardingExchangeInput {
  code: string;
  redirectUri: string;
  requestedPhoneNumber?: string | null;
  businessAccountId?: string | null;
  phoneNumberId?: string | null;
  connectedPhoneDisplay?: string | null;
}

export interface MetaWhatsappOnboardingExchangeResult {
  accessToken: string;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  connectedPhoneDisplay: string | null;
}

@Injectable()
export class MetaWhatsappPlatformService {
  constructor(private readonly prisma: PrismaService) {}

  verifyWebhookChallenge(
    query: Record<string, string | string[] | undefined>,
  ): string {
    const mode = this.readQueryValue(query, ['hub.mode']);
    const verifyToken = this.readQueryValue(query, ['hub.verify_token']);
    const challenge = this.readQueryValue(query, ['hub.challenge']);

    if (mode !== 'subscribe') {
      throw new BadRequestException(
        'O webhook publico da Meta exige hub.mode=subscribe.',
      );
    }

    if (!challenge) {
      throw new BadRequestException(
        'O webhook publico da Meta exige hub.challenge.',
      );
    }

    if (!verifyToken || verifyToken !== this.resolveWebhookVerifyToken()) {
      throw new ForbiddenException(
        'O verify token do webhook da Meta nao confere com a configuracao da plataforma.',
      );
    }

    return challenge;
  }

  async handleWebhookEvent(input: {
    body: unknown;
    signatureHeader?: string | string[];
    rawBody?: Buffer | string | null;
  }): Promise<MetaWhatsappWebhookAckResponse> {
    this.verifyWebhookSignatureIfPossible(
      input.body,
      input.rawBody,
      input.signatureHeader,
    );

    const statusEvents = this.extractDeliveryStatusEvents(input.body);
    let updatedDeliveries = 0;
    let ignoredStatuses = 0;

    for (const statusEvent of statusEvents) {
      const nextStatus = this.mapDeliveryStatus(statusEvent.status);

      if (!statusEvent.providerMessageId || !nextStatus) {
        ignoredStatuses += 1;
        continue;
      }

      const matchingDeliveries = await this.prisma.noticeDelivery.findMany({
        where: {
          providerMessageId: statusEvent.providerMessageId,
        },
        select: {
          id: true,
          sentAt: true,
        },
      });

      if (matchingDeliveries.length === 0) {
        ignoredStatuses += 1;
        continue;
      }

      for (const delivery of matchingDeliveries) {
        await this.prisma.noticeDelivery.update({
          where: {
            id: delivery.id,
          },
          data: {
            status: nextStatus,
            sentAt:
              nextStatus === NoticeDeliveryStatus.SENT
                ? delivery.sentAt ?? statusEvent.timestamp ?? new Date()
                : delivery.sentAt,
            errorMessage:
              nextStatus === NoticeDeliveryStatus.FAILED
                ? this.buildWebhookErrorMessage(statusEvent)
                : null,
          },
        });
        updatedDeliveries += 1;
      }
    }

    return {
      received: true,
      updatedDeliveries,
      ignoredStatuses,
    };
  }

  async exchangeOnboardingCode(
    input: MetaWhatsappOnboardingExchangeInput,
  ): Promise<MetaWhatsappOnboardingExchangeResult> {
    const normalizedCode = this.normalizeOptionalString(input.code);
    const normalizedRedirectUri = this.normalizeOptionalString(input.redirectUri);

    if (!normalizedCode) {
      throw new BadRequestException(
        'O callback da Meta precisa receber um code valido para concluir o onboarding.',
      );
    }

    if (!normalizedRedirectUri) {
      throw new BadRequestException(
        'A plataforma precisa de um redirectUri valido para trocar o code do onboarding.',
      );
    }

    const appId = this.resolveRequiredEnv(
      META_APP_ID_ENV,
      'Configure o app id da Meta em nivel de plataforma para concluir o onboarding.',
    );
    const appSecret = this.resolveRequiredEnv(
      META_APP_SECRET_ENV,
      'Configure o app secret da Meta em nivel de plataforma para concluir o onboarding.',
    );
    const tokenResponse = await this.fetchJson<MetaGraphTokenResponse>(
      `${META_GRAPH_API_BASE_URL}/oauth/access_token?${new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code: normalizedCode,
        redirect_uri: normalizedRedirectUri,
      }).toString()}`,
      {
        method: 'GET',
      },
      'Nao foi possivel trocar o code do onboarding pelo token oficial da Meta.',
    );
    const accessToken = this.normalizeOptionalString(tokenResponse.access_token);

    if (!accessToken) {
      throw new BadRequestException(
        'A Meta respondeu ao code exchange sem access token valido.',
      );
    }

    let businessAccountId =
      this.normalizeOptionalString(input.businessAccountId) ??
      (await this.resolveBusinessAccountIdFromToken(accessToken, appId, appSecret));
    let phoneNumberId = this.normalizeOptionalString(input.phoneNumberId);
    let connectedPhoneDisplay = this.normalizeOptionalString(
      input.connectedPhoneDisplay,
    );

    if (businessAccountId) {
      const phoneNumbers = await this.listPhoneNumbers(
        businessAccountId,
        accessToken,
      );
      const selectedPhoneNumber = this.selectPhoneNumber(phoneNumbers, {
        requestedPhoneNumber: input.requestedPhoneNumber,
        phoneNumberId,
      });

      phoneNumberId = phoneNumberId ?? selectedPhoneNumber?.id ?? null;
      connectedPhoneDisplay =
        connectedPhoneDisplay ??
        selectedPhoneNumber?.displayPhoneNumber ??
        phoneNumbers[0]?.displayPhoneNumber ??
        null;
    }

    return {
      accessToken,
      businessAccountId,
      phoneNumberId,
      connectedPhoneDisplay,
    };
  }

  private async resolveBusinessAccountIdFromToken(
    accessToken: string,
    appId: string,
    appSecret: string,
  ): Promise<string | null> {
    const response = await this.fetchJson<MetaGraphDebugTokenResponse>(
      `${META_GRAPH_API_BASE_URL}/debug_token?${new URLSearchParams({
        input_token: accessToken,
        access_token: `${appId}|${appSecret}`,
      }).toString()}`,
      {
        method: 'GET',
      },
      'Nao foi possivel resolver a conta de negocio do WhatsApp a partir do token retornado pela Meta.',
    );

    const granularScopes = Array.isArray(response.data?.granular_scopes)
      ? response.data.granular_scopes
      : [];

    for (const granularScope of granularScopes) {
      const targetIds = Array.isArray(granularScope.target_ids)
        ? granularScope.target_ids
        : [];

      for (const targetId of targetIds) {
        const normalizedTargetId = this.normalizeOptionalString(String(targetId));

        if (normalizedTargetId) {
          return normalizedTargetId;
        }
      }
    }

    return null;
  }

  private async listPhoneNumbers(
    businessAccountId: string,
    accessToken: string,
  ): Promise<
    Array<{
      id: string;
      displayPhoneNumber: string | null;
      verifiedName: string | null;
    }>
  > {
    const response = await this.fetchJson<MetaGraphPhoneNumbersResponse>(
      `${META_GRAPH_API_BASE_URL}/${businessAccountId}/phone_numbers?${new URLSearchParams(
        {
          fields: 'id,display_phone_number,verified_name',
        },
      ).toString()}`,
      {
        method: 'GET',
        accessToken,
      },
      'Nao foi possivel listar os phone numbers vinculados a conta oficial do WhatsApp.',
    );

    const phoneNumbers = Array.isArray(response.data) ? response.data : [];

    return phoneNumbers
      .map((phoneNumber) => ({
        id: this.normalizeOptionalString(phoneNumber.id),
        displayPhoneNumber: this.normalizeOptionalString(
          phoneNumber.display_phone_number,
        ),
        verifiedName: this.normalizeOptionalString(phoneNumber.verified_name),
      }))
      .filter(
        (
          phoneNumber,
        ): phoneNumber is {
          id: string;
          displayPhoneNumber: string | null;
          verifiedName: string | null;
        } => Boolean(phoneNumber.id),
      );
  }

  private selectPhoneNumber(
    phoneNumbers: Array<{
      id: string;
      displayPhoneNumber: string | null;
      verifiedName: string | null;
    }>,
    options: {
      requestedPhoneNumber?: string | null;
      phoneNumberId?: string | null;
    },
  ) {
    const requestedPhoneDigits = this.normalizePhoneDigits(
      options.requestedPhoneNumber,
    );
    const normalizedPhoneNumberId = this.normalizeOptionalString(
      options.phoneNumberId,
    );

    if (normalizedPhoneNumberId) {
      const matchedById = phoneNumbers.find(
        (phoneNumber) => phoneNumber.id === normalizedPhoneNumberId,
      );

      if (matchedById) {
        return matchedById;
      }
    }

    if (requestedPhoneDigits) {
      const matchedByRequestedNumber = phoneNumbers.find((phoneNumber) => {
        const candidateDigits = this.normalizePhoneDigits(
          phoneNumber.displayPhoneNumber,
        );

        if (!candidateDigits) {
          return false;
        }

        return (
          candidateDigits === requestedPhoneDigits ||
          candidateDigits.endsWith(requestedPhoneDigits) ||
          requestedPhoneDigits.endsWith(candidateDigits)
        );
      });

      if (matchedByRequestedNumber) {
        return matchedByRequestedNumber;
      }
    }

    return phoneNumbers[0] ?? null;
  }

  private verifyWebhookSignatureIfPossible(
    body: unknown,
    rawBody: Buffer | string | null | undefined,
    signatureHeader?: string | string[],
  ): void {
    const appSecret = this.normalizeOptionalString(process.env[META_APP_SECRET_ENV]);
    const normalizedSignatureHeader = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    if (!appSecret || !normalizedSignatureHeader) {
      return;
    }

    if (!normalizedSignatureHeader.startsWith('sha256=')) {
      throw new ForbiddenException(
        'A assinatura enviada pela Meta no webhook esta malformada.',
      );
    }

    const providedSignature = normalizedSignatureHeader.slice('sha256='.length);
    const payloadBuffer = this.resolveWebhookPayloadBuffer(body, rawBody);
    const expectedSignature = createHmac('sha256', appSecret)
      .update(payloadBuffer)
      .digest('hex');

    if (
      expectedSignature.length !== providedSignature.length ||
      !timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(providedSignature, 'utf-8'),
      )
    ) {
      throw new ForbiddenException(
        'A assinatura do webhook da Meta nao confere com o payload recebido.',
      );
    }
  }

  private resolveWebhookPayloadBuffer(
    body: unknown,
    rawBody: Buffer | string | null | undefined,
  ): Buffer {
    if (Buffer.isBuffer(rawBody)) {
      return rawBody;
    }

    if (typeof rawBody === 'string') {
      return Buffer.from(rawBody, 'utf-8');
    }

    return Buffer.from(JSON.stringify(body ?? {}), 'utf-8');
  }

  private extractDeliveryStatusEvents(body: unknown): MetaWebhookStatusEvent[] {
    if (!body || typeof body !== 'object') {
      return [];
    }

    const candidateBody = body as {
      object?: unknown;
      entry?: Array<{
        changes?: Array<{
          value?: {
            statuses?: Array<{
              id?: unknown;
              status?: unknown;
              timestamp?: unknown;
              errors?: unknown;
            }>;
          };
        }>;
      }>;
    };

    if (candidateBody.object !== 'whatsapp_business_account') {
      return [];
    }

    const entries = Array.isArray(candidateBody.entry) ? candidateBody.entry : [];
    const statusEvents: MetaWebhookStatusEvent[] = [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        const statuses = Array.isArray(change.value?.statuses)
          ? change.value.statuses
          : [];

        for (const status of statuses) {
          statusEvents.push({
            providerMessageId: this.normalizeOptionalString(
              typeof status.id === 'string' ? status.id : null,
            ),
            status: this.normalizeOptionalString(
              typeof status.status === 'string' ? status.status : null,
            ),
            timestamp: this.parseWebhookTimestamp(status.timestamp),
            errors: this.normalizeWebhookErrors(status.errors),
          });
        }
      }
    }

    return statusEvents;
  }

  private normalizeWebhookErrors(errors: unknown): MetaWebhookStatusError[] {
    if (!Array.isArray(errors)) {
      return [];
    }

    return errors
      .filter((error): error is Record<string, unknown> => Boolean(error) && typeof error === 'object')
      .map((error) => ({
        code:
          typeof error.code === 'number'
            ? error.code
            : typeof error.code === 'string'
              ? Number(error.code)
              : undefined,
        title:
          typeof error.title === 'string'
            ? error.title
            : typeof error.error_user_title === 'string'
              ? error.error_user_title
              : undefined,
        message:
          typeof error.message === 'string'
            ? error.message
            : typeof error.error_user_msg === 'string'
              ? error.error_user_msg
              : undefined,
        details:
          typeof error.details === 'string'
            ? error.details
            : undefined,
        error_data:
          error.error_data && typeof error.error_data === 'object'
            ? {
                details:
                  typeof (error.error_data as { details?: unknown }).details ===
                  'string'
                    ? (error.error_data as { details: string }).details
                    : undefined,
              }
            : undefined,
      }));
  }

  private parseWebhookTimestamp(value: unknown): Date | null {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return null;
    }

    const parsedDate = new Date(numericValue * 1000);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private mapDeliveryStatus(
    status: string | null,
  ): NoticeDeliveryStatus | null {
    if (!status) {
      return null;
    }

    const normalizedStatus = status.trim().toLowerCase();

    if (['sent', 'delivered', 'read'].includes(normalizedStatus)) {
      return NoticeDeliveryStatus.SENT;
    }

    if (normalizedStatus === 'failed') {
      return NoticeDeliveryStatus.FAILED;
    }

    return null;
  }

  private buildWebhookErrorMessage(statusEvent: MetaWebhookStatusEvent): string {
    const firstError = statusEvent.errors[0];

    if (!firstError) {
      return 'A Meta informou falha de entrega para a mensagem enviada.';
    }

    const details = [
      firstError.title,
      firstError.message,
      firstError.error_data?.details,
      firstError.details,
      firstError.code ? `codigo ${firstError.code}` : null,
    ]
      .filter(Boolean)
      .join(' - ');

    return details || 'A Meta informou falha de entrega para a mensagem enviada.';
  }

  private resolveWebhookVerifyToken(): string {
    return this.resolveRequiredEnv(
      META_WEBHOOK_VERIFY_TOKEN_ENV,
      'Configure o verify token do webhook da Meta em nivel de plataforma.',
    );
  }

  private resolveRequiredEnv(envName: string, errorMessage: string): string {
    const normalizedValue = this.normalizeOptionalString(process.env[envName]);

    if (!normalizedValue) {
      throw new BadRequestException(errorMessage);
    }

    return normalizedValue;
  }

  private async fetchJson<TResponse>(
    url: string,
    options: {
      method: 'GET' | 'POST';
      accessToken?: string;
      body?: string;
    },
    fallbackErrorMessage: string,
  ): Promise<TResponse> {
    const response = await fetch(url, {
      method: options.method,
      headers: {
        ...(options.accessToken
          ? {
              Authorization: `Bearer ${options.accessToken}`,
            }
          : {}),
        ...(options.body
          ? {
              'Content-Type': 'application/json',
            }
          : {}),
      },
      body: options.body,
      signal: AbortSignal.timeout(15000),
    });
    const responseBody = await this.parseResponseBody(response);

    if (!response.ok) {
      throw new BadRequestException(
        this.buildMetaApiErrorMessage(response.status, responseBody, fallbackErrorMessage),
      );
    }

    return responseBody as TResponse;
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

  private buildMetaApiErrorMessage(
    statusCode: number,
    responseBody: unknown,
    fallbackErrorMessage: string,
  ): string {
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'error' in responseBody &&
      responseBody.error &&
      typeof responseBody.error === 'object'
    ) {
      const error = responseBody.error as {
        message?: unknown;
        error_user_title?: unknown;
        error_user_msg?: unknown;
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

      return details || fallbackErrorMessage;
    }

    return `${fallbackErrorMessage} Codigo HTTP ${statusCode}.`;
  }

  private readQueryValue(
    query: Record<string, string | string[] | undefined>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const rawValue = query[key];
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
      const normalizedValue = this.normalizeOptionalString(value);

      if (normalizedValue) {
        return normalizedValue;
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

  private normalizePhoneDigits(value?: string | null): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.replace(/\D/g, '');
  }
}
