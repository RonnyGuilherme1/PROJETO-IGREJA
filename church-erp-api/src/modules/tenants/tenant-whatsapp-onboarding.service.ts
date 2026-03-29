import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  WhatsappConnectionStatus,
  WhatsappIntegrationProvider,
} from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import { PrismaService } from '../../database/prisma/prisma.service';
import { MetaWhatsappPlatformService } from '../notice-delivery/meta-whatsapp-platform.service';

const ONBOARDING_STATE_VERSION = 1;
const ONBOARDING_MODE = 'HOSTED_EMBEDDED_SIGNUP';
const LEGACY_ONBOARDING_MODE = 'HOSTED_OR_EMBEDDED_SIGNUP_PLACEHOLDER';
const START_ENDPOINT_PATH = '/public/whatsapp/onboarding/start';
const CALLBACK_ENDPOINT_PATH = '/public/whatsapp/onboarding/callback';
const API_PUBLIC_URL_ENV = 'API_PUBLIC_URL';

interface StoredOnboardingState {
  version: number;
  mode: string;
  stateToken: string;
  nonce: string;
  generatedAt: string;
  requestedPhoneNumber: string;
  callbackUrl: string;
  lastStatus: WhatsappConnectionStatus;
  lastCallbackAt?: string;
  lastCallbackPayload?: Record<string, string | null>;
  completedAt?: string;
  businessAccountId?: string | null;
  phoneNumberId?: string | null;
  connectedPhoneDisplay?: string | null;
  lastErrorMessage?: string | null;
}

interface StateTokenPayload {
  tenantId: string;
  nonce: string;
  generatedAt: string;
}

interface CallbackResolution {
  connectionStatus: WhatsappConnectionStatus;
  businessAccountId?: string | null;
  phoneNumberId?: string | null;
  connectedPhoneDisplay?: string | null;
  accessToken?: string | null;
  onboardingState: StoredOnboardingState;
  lastConnectedAt?: Date | null;
  lastErrorMessage: string | null;
  message: string;
}

export interface TenantWhatsappIntegrationStatusResponse {
  tenantId: string;
  provider: WhatsappIntegrationProvider;
  connectionStatus: WhatsappConnectionStatus;
  requestedPhoneNumber: string | null;
  connectedPhoneDisplay: string | null;
  businessAccountId: string | null;
  phoneNumberId: string | null;
  onboardingState: string | null;
  lastConnectedAt: Date | null;
  lastErrorMessage: string | null;
  updatedAt: Date | null;
}

export interface TenantWhatsappOnboardingLinkResponse
  extends TenantWhatsappIntegrationStatusResponse {
  onboardingLink: string;
}

export interface PublicWhatsappOnboardingCallbackResponse {
  ok: boolean;
  tenantId: string;
  connectionStatus: WhatsappConnectionStatus;
  message: string;
}

@Injectable()
export class TenantWhatsappOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaWhatsappPlatformService: MetaWhatsappPlatformService,
  ) {}

  async getMasterStatus(
    tenantId: string,
  ): Promise<TenantWhatsappIntegrationStatusResponse> {
    await this.ensureTenantExists(tenantId);
    const config = await this.prisma.whatsappIntegrationConfig.findUnique({
      where: { tenantId },
      select: {
        tenantId: true,
        provider: true,
        connectionStatus: true,
        requestedPhoneNumber: true,
        connectedPhoneDisplay: true,
        businessAccountId: true,
        phoneNumberId: true,
        onboardingState: true,
        lastConnectedAt: true,
        lastErrorMessage: true,
        updatedAt: true,
      },
    });

    return {
      tenantId,
      provider: config?.provider ?? WhatsappIntegrationProvider.WHATSAPP_CLOUD_API,
      connectionStatus:
        config?.connectionStatus ?? WhatsappConnectionStatus.NOT_CONFIGURED,
      requestedPhoneNumber: config?.requestedPhoneNumber ?? null,
      connectedPhoneDisplay: config?.connectedPhoneDisplay ?? null,
      businessAccountId: config?.businessAccountId ?? null,
      phoneNumberId: config?.phoneNumberId ?? null,
      onboardingState: config?.onboardingState ?? null,
      lastConnectedAt: config?.lastConnectedAt ?? null,
      lastErrorMessage: config?.lastErrorMessage ?? null,
      updatedAt: config?.updatedAt ?? null,
    };
  }

  async generateOnboardingLink(
    tenantId: string,
    requestedPhoneNumber: string,
    fallbackApiBaseUrl: string,
  ): Promise<TenantWhatsappOnboardingLinkResponse> {
    await this.ensureTenantExists(tenantId);

    const normalizedRequestedPhoneNumber =
      this.normalizeWhatsappPhoneNumber(requestedPhoneNumber);
    const generatedAt = new Date().toISOString();
    const nonce = randomUUID();
    const stateToken = this.createStateToken({
      tenantId,
      nonce,
      generatedAt,
    });
    const publicApiBaseUrl = this.resolvePublicApiBaseUrl(fallbackApiBaseUrl);
    const callbackUrl = `${publicApiBaseUrl}${CALLBACK_ENDPOINT_PATH}`;
    const onboardingLink = `${publicApiBaseUrl}${START_ENDPOINT_PATH}?state=${encodeURIComponent(
      stateToken,
    )}`;
    const onboardingState: StoredOnboardingState = {
      version: ONBOARDING_STATE_VERSION,
      mode: ONBOARDING_MODE,
      stateToken,
      nonce,
      generatedAt,
      requestedPhoneNumber: normalizedRequestedPhoneNumber,
      callbackUrl,
      lastStatus: WhatsappConnectionStatus.PENDING_AUTHORIZATION,
    };

    const config = await this.prisma.whatsappIntegrationConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        requestedPhoneNumber: normalizedRequestedPhoneNumber,
        connectionStatus: WhatsappConnectionStatus.PENDING_AUTHORIZATION,
        onboardingState: JSON.stringify(onboardingState),
        lastErrorMessage: null,
      },
      update: {
        requestedPhoneNumber: normalizedRequestedPhoneNumber,
        connectionStatus: WhatsappConnectionStatus.PENDING_AUTHORIZATION,
        onboardingState: JSON.stringify(onboardingState),
        lastErrorMessage: null,
      },
      select: {
        tenantId: true,
        provider: true,
        connectionStatus: true,
        requestedPhoneNumber: true,
        connectedPhoneDisplay: true,
        businessAccountId: true,
        phoneNumberId: true,
        onboardingState: true,
        lastConnectedAt: true,
        lastErrorMessage: true,
        updatedAt: true,
      },
    });

    return {
      tenantId,
      provider: config.provider,
      connectionStatus: config.connectionStatus,
      requestedPhoneNumber: config.requestedPhoneNumber,
      connectedPhoneDisplay: config.connectedPhoneDisplay,
      businessAccountId: config.businessAccountId,
      phoneNumberId: config.phoneNumberId,
      onboardingState: config.onboardingState,
      lastConnectedAt: config.lastConnectedAt,
      lastErrorMessage: config.lastErrorMessage,
      updatedAt: config.updatedAt,
      onboardingLink,
    };
  }

  async startOnboarding(
    stateToken: string,
  ): Promise<string> {
    if (!stateToken.trim()) {
      throw new BadRequestException(
        'O link de onboarding do WhatsApp precisa receber o parametro state.',
      );
    }

    const config = await this.findConfigByStateTokenOrThrow(stateToken);
    const storedState = this.parseStoredOnboardingState(config.onboardingState);

    this.ensureValidStateToken(stateToken, storedState);

    // O endpoint publico start valida o state salvo e redireciona para o Hosted/Embedded Signup oficial da Meta.
    return this.metaWhatsappPlatformService.buildHostedSignupUrl({
      state: stateToken,
      redirectUri: storedState.callbackUrl,
    });
  }

  async handleCallback(
    query: Record<string, string | string[] | undefined>,
  ): Promise<PublicWhatsappOnboardingCallbackResponse> {
    const stateToken = this.readQueryValue(query, ['state', 'onboarding_state']);

    if (!stateToken) {
      throw new BadRequestException(
        'O callback de onboarding do WhatsApp precisa receber o parametro state.',
      );
    }

    const config = await this.findConfigByStateTokenOrThrow(stateToken);
    const storedState = this.parseStoredOnboardingState(config.onboardingState);

    this.ensureValidStateToken(stateToken, storedState);

    const callbackResolution = await this.resolveCallbackPayload(
      query,
      storedState,
      config.connectedPhoneDisplay,
    );

    await this.prisma.whatsappIntegrationConfig.update({
      where: { tenantId: config.tenantId },
      data: {
        businessAccountId: callbackResolution.businessAccountId,
        phoneNumberId: callbackResolution.phoneNumberId,
        connectedPhoneDisplay: callbackResolution.connectedPhoneDisplay,
        onboardingState: JSON.stringify(callbackResolution.onboardingState),
        connectionStatus: callbackResolution.connectionStatus,
        // Aqui a conexao oficial do tenant e marcada como concluida ou com erro final.
        lastConnectedAt: callbackResolution.lastConnectedAt,
        lastErrorMessage: callbackResolution.lastErrorMessage,
        accessToken:
          callbackResolution.accessToken !== undefined
            ? callbackResolution.accessToken
            : undefined,
      },
    });

    return {
      ok: callbackResolution.connectionStatus === WhatsappConnectionStatus.CONNECTED,
      tenantId: config.tenantId,
      connectionStatus: callbackResolution.connectionStatus,
      message: callbackResolution.message,
    };
  }

  private async ensureTenantExists(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado.');
    }
  }

  private async findConfigByStateTokenOrThrow(stateToken: string) {
    const decodedState = this.decodeStateToken(stateToken);
    const config = await this.prisma.whatsappIntegrationConfig.findUnique({
      where: { tenantId: decodedState.tenantId },
      select: {
        tenantId: true,
        connectionStatus: true,
        onboardingState: true,
        businessAccountId: true,
        phoneNumberId: true,
        connectedPhoneDisplay: true,
        lastConnectedAt: true,
      },
    });

    if (!config?.onboardingState) {
      throw new NotFoundException(
        'Nao encontramos um fluxo de onboarding pendente para este tenant.',
      );
    }

    return config;
  }

  private async resolveCallbackPayload(
    query: Record<string, string | string[] | undefined>,
    storedState: StoredOnboardingState,
    previousConnectedPhoneDisplay: string | null,
  ): Promise<CallbackResolution> {
    const callbackPayload = this.extractCallbackPayload(query);
    const errorMessage = this.readQueryValue(query, [
      'error_message',
      'error_description',
      'error',
      'error_reason',
      'message',
    ]);
    const normalizedStatus = this.normalizeStatus(
      this.readQueryValue(query, ['status', 'result', 'connection_status']),
    );
    const code = this.readQueryValue(query, ['code', 'auth_code']);
    let businessAccountId = this.readQueryValue(query, [
      'businessAccountId',
      'business_account_id',
      'waba_id',
    ]);
    let phoneNumberId = this.readQueryValue(query, [
      'phoneNumberId',
      'phone_number_id',
      'phone_id',
    ]);
    let connectedPhoneDisplay =
      this.readQueryValue(query, [
        'connectedPhoneDisplay',
        'display_phone_number',
        'phone_number_display',
      ]) ?? previousConnectedPhoneDisplay;
    let accessToken: string | null | undefined;
    const nextStoredState: StoredOnboardingState = {
      ...storedState,
      lastCallbackAt: new Date().toISOString(),
      lastCallbackPayload: callbackPayload,
      lastStatus: WhatsappConnectionStatus.ERROR,
    };

    if (errorMessage || normalizedStatus === 'error') {
      return this.buildErrorCallbackResolution({
        storedState: nextStoredState,
        businessAccountId,
        phoneNumberId,
        connectedPhoneDisplay,
        message:
          errorMessage ?? 'O callback do onboarding retornou erro para o tenant.',
      });
    }

    if (!code) {
      return this.buildErrorCallbackResolution({
        storedState: nextStoredState,
        businessAccountId,
        phoneNumberId,
        connectedPhoneDisplay,
        message:
          'O callback de onboarding do WhatsApp foi recebido sem o parametro code da Meta.',
      });
    }

    try {
      // O code exchange oficial ocorre aqui, reaproveitando o servico de plataforma da Meta.
      const onboardingExchange =
        await this.metaWhatsappPlatformService.exchangeOnboardingCode({
          code,
          redirectUri: storedState.callbackUrl,
          requestedPhoneNumber: storedState.requestedPhoneNumber,
          businessAccountId,
          phoneNumberId,
          connectedPhoneDisplay:
            connectedPhoneDisplay ??
            storedState.requestedPhoneNumber ??
            previousConnectedPhoneDisplay,
        });

      accessToken = onboardingExchange.accessToken;
      businessAccountId =
        businessAccountId ?? onboardingExchange.businessAccountId;
      phoneNumberId = phoneNumberId ?? onboardingExchange.phoneNumberId;
      connectedPhoneDisplay =
        onboardingExchange.connectedPhoneDisplay ?? connectedPhoneDisplay;
    } catch (error) {
      return this.buildErrorCallbackResolution({
        storedState: nextStoredState,
        businessAccountId,
        phoneNumberId,
        connectedPhoneDisplay,
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel concluir a troca do code do onboarding pela Meta.',
      });
    }

    if (businessAccountId && phoneNumberId) {
      const connectedAt = new Date();
      nextStoredState.lastStatus = WhatsappConnectionStatus.CONNECTED;
      nextStoredState.completedAt = connectedAt.toISOString();
      nextStoredState.businessAccountId = businessAccountId;
      nextStoredState.phoneNumberId = phoneNumberId;
      nextStoredState.connectedPhoneDisplay = connectedPhoneDisplay;
      nextStoredState.lastErrorMessage = null;

      return {
        connectionStatus: WhatsappConnectionStatus.CONNECTED,
        businessAccountId,
        phoneNumberId,
        connectedPhoneDisplay,
        accessToken,
        onboardingState: nextStoredState,
        lastConnectedAt: connectedAt,
        lastErrorMessage: null,
        message: 'Onboarding do WhatsApp concluido com sucesso.',
      };
    }

    return this.buildErrorCallbackResolution({
      storedState: nextStoredState,
      businessAccountId,
      phoneNumberId,
      connectedPhoneDisplay,
      accessToken,
      message:
        'O callback do onboarding nao trouxe businessAccountId e phoneNumberId validos para conectar o tenant.',
    });
  }

  private parseStoredOnboardingState(
    onboardingState: string | null,
  ): StoredOnboardingState {
    if (!onboardingState) {
      throw new NotFoundException(
        'Nao encontramos um estado de onboarding salvo para este tenant.',
      );
    }

    try {
      const parsedState = JSON.parse(onboardingState) as Partial<StoredOnboardingState>;

      if (
        parsedState.version !== ONBOARDING_STATE_VERSION ||
        ![ONBOARDING_MODE, LEGACY_ONBOARDING_MODE].includes(
          parsedState.mode ?? '',
        ) ||
        typeof parsedState.stateToken !== 'string' ||
        typeof parsedState.nonce !== 'string' ||
        typeof parsedState.generatedAt !== 'string' ||
        typeof parsedState.requestedPhoneNumber !== 'string' ||
        typeof parsedState.callbackUrl !== 'string'
      ) {
        throw new Error('invalid');
      }

      return {
        version: parsedState.version,
        mode: parsedState.mode ?? ONBOARDING_MODE,
        stateToken: parsedState.stateToken,
        nonce: parsedState.nonce,
        generatedAt: parsedState.generatedAt,
        requestedPhoneNumber: parsedState.requestedPhoneNumber,
        callbackUrl: parsedState.callbackUrl,
        lastStatus:
          parsedState.lastStatus ?? WhatsappConnectionStatus.PENDING_AUTHORIZATION,
        lastCallbackAt: parsedState.lastCallbackAt,
        lastCallbackPayload: parsedState.lastCallbackPayload,
        completedAt: parsedState.completedAt,
        businessAccountId: parsedState.businessAccountId ?? null,
        phoneNumberId: parsedState.phoneNumberId ?? null,
        connectedPhoneDisplay: parsedState.connectedPhoneDisplay ?? null,
        lastErrorMessage: parsedState.lastErrorMessage ?? null,
      };
    } catch {
      throw new BadRequestException(
        'O estado salvo do onboarding do WhatsApp esta invalido.',
      );
    }
  }

  private createStateToken(payload: StateTokenPayload): string {
    const payloadString = JSON.stringify(payload);
    const payloadBase64Url = this.toBase64Url(payloadString);
    const signatureBase64Url = this.createSignature(payloadBase64Url);

    return `${payloadBase64Url}.${signatureBase64Url}`;
  }

  private decodeStateToken(stateToken: string): StateTokenPayload {
    const [payloadBase64Url, signatureBase64Url] = stateToken.split('.');

    if (!payloadBase64Url || !signatureBase64Url) {
      throw new BadRequestException(
        'O token de onboarding do WhatsApp esta malformado.',
      );
    }

    const expectedSignature = this.createSignature(payloadBase64Url);

    if (
      expectedSignature.length !== signatureBase64Url.length ||
      !timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signatureBase64Url),
      )
    ) {
      throw new BadRequestException(
        'O token de onboarding do WhatsApp nao e valido.',
      );
    }

    try {
      const parsedPayload = JSON.parse(
        this.fromBase64Url(payloadBase64Url),
      ) as Partial<StateTokenPayload>;

      if (
        typeof parsedPayload.tenantId !== 'string' ||
        typeof parsedPayload.nonce !== 'string' ||
        typeof parsedPayload.generatedAt !== 'string'
      ) {
        throw new Error('invalid');
      }

      return {
        tenantId: parsedPayload.tenantId,
        nonce: parsedPayload.nonce,
        generatedAt: parsedPayload.generatedAt,
      };
    } catch {
      throw new BadRequestException(
        'O token de onboarding do WhatsApp nao pode ser interpretado.',
      );
    }
  }

  private ensureValidStateToken(
    stateToken: string,
    storedState: StoredOnboardingState,
  ): void {
    const decodedState = this.decodeStateToken(stateToken);

    if (
      storedState.stateToken !== stateToken ||
      storedState.nonce !== decodedState.nonce ||
      storedState.generatedAt !== decodedState.generatedAt
    ) {
      throw new BadRequestException(
        'O estado do onboarding do WhatsApp nao corresponde ao fluxo salvo para este tenant.',
      );
    }
  }

  private createSignature(payloadBase64Url: string): string {
    const secret = process.env.JWT_SECRET?.trim();

    if (!secret) {
      throw new BadRequestException(
        'A plataforma nao possui segredo configurado para assinar o onboarding do WhatsApp.',
      );
    }

    return createHmac('sha256', secret)
      .update(payloadBase64Url)
      .digest('base64url');
  }

  private toBase64Url(value: string): string {
    return Buffer.from(value, 'utf-8').toString('base64url');
  }

  private fromBase64Url(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf-8');
  }

  private extractCallbackPayload(
    query: Record<string, string | string[] | undefined>,
  ): Record<string, string | null> {
    return Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key,
        this.sanitizeCallbackValue(
          key,
          Array.isArray(value) ? (value[0] ?? null) : value ?? null,
        ),
      ]),
    );
  }

  private buildErrorCallbackResolution(input: {
    storedState: StoredOnboardingState;
    businessAccountId?: string | null;
    phoneNumberId?: string | null;
    connectedPhoneDisplay?: string | null;
    accessToken?: string | null;
    message: string;
  }): CallbackResolution {
    input.storedState.lastStatus = WhatsappConnectionStatus.ERROR;
    input.storedState.completedAt = new Date().toISOString();
    input.storedState.businessAccountId = input.businessAccountId ?? null;
    input.storedState.phoneNumberId = input.phoneNumberId ?? null;
    input.storedState.connectedPhoneDisplay =
      input.connectedPhoneDisplay ?? null;
    input.storedState.lastErrorMessage = input.message;

    return {
      connectionStatus: WhatsappConnectionStatus.ERROR,
      businessAccountId: input.businessAccountId ?? undefined,
      phoneNumberId: input.phoneNumberId ?? undefined,
      connectedPhoneDisplay: input.connectedPhoneDisplay ?? undefined,
      accessToken: input.accessToken,
      onboardingState: input.storedState,
      lastErrorMessage: input.message,
      message: input.message,
    };
  }

  private sanitizeCallbackValue(
    key: string,
    value: string | null,
  ): string | null {
    if (!value) {
      return value;
    }

    if (['code', 'auth_code', 'access_token'].includes(key.toLowerCase())) {
      return '[redacted]';
    }

    return value;
  }

  private resolvePublicApiBaseUrl(fallbackApiBaseUrl: string): string {
    const configuredApiPublicUrl = this.readOptionalEnv(API_PUBLIC_URL_ENV);

    if (configuredApiPublicUrl) {
      return this.normalizePublicApiBaseUrl(configuredApiPublicUrl);
    }

    return this.normalizePublicApiBaseUrl(fallbackApiBaseUrl);
  }

  private normalizePublicApiBaseUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);

      if (!url.pathname || url.pathname === '/') {
        url.pathname = '/api';
      }

      return url.toString().replace(/\/$/, '');
    } catch {
      throw new BadRequestException(
        'A plataforma nao possui uma API_PUBLIC_URL valida para o onboarding oficial do WhatsApp.',
      );
    }
  }

  private readOptionalEnv(envName: string): string | null {
    const envValue = process.env[envName];

    if (typeof envValue !== 'string') {
      return null;
    }

    const trimmedValue = envValue.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private readQueryValue(
    query: Record<string, string | string[] | undefined>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const rawValue = query[key];
      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

      if (typeof value === 'string') {
        const trimmedValue = value.trim();

        if (trimmedValue.length > 0) {
          return trimmedValue;
        }
      }
    }

    return null;
  }

  private normalizeWhatsappPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      throw new BadRequestException(
        'Informe o numero do cliente em formato internacional com 10 a 15 digitos.',
      );
    }

    return `+${digits}`;
  }

  private normalizeStatus(value: string | null): 'success' | 'error' | null {
    if (!value) {
      return null;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (
      ['success', 'connected', 'authorized', 'authorised'].includes(
        normalizedValue,
      )
    ) {
      return 'success';
    }

    if (
      ['error', 'failed', 'cancelled', 'canceled', 'denied'].includes(
        normalizedValue,
      )
    ) {
      return 'error';
    }

    return null;
  }
}
