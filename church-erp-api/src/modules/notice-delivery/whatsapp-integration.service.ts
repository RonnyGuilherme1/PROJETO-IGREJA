import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  Prisma,
  UserRole,
  WhatsappConnectionStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateWhatsappIntegrationConfigDto } from './dto/update-whatsapp-integration-config.dto';
import { WhatsappIntegrationConfigResponseDto } from './dto/whatsapp-integration-config-response.dto';
import { WhatsappIntegrationStatusResponseDto } from './dto/whatsapp-integration-status-response.dto';
import {
  WhatsappIntegrationConfigEntity,
  whatsappIntegrationConfigSelect,
} from './types/whatsapp-integration.type';
import { WhatsappDestinationsService } from './whatsapp-destinations.service';

@Injectable()
export class WhatsappIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappDestinationsService: WhatsappDestinationsService,
  ) {}

  async getStatus(
    currentUser: AuthenticatedUser,
  ): Promise<WhatsappIntegrationStatusResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const config = await this.findConfigByTenantId(tenantId);
    const activeDestinationsCount =
      config?.destinations.filter((destination) => destination.enabled).length ?? 0;
    const hasAccessToken = Boolean(config?.accessToken);
    const hasPhoneNumberId = Boolean(config?.phoneNumberId);
    const hasConnectedSession =
      config?.connectionStatus === WhatsappConnectionStatus.CONNECTED;
    const hasDestinations = activeDestinationsCount > 0;
    const enabled = config?.enabled ?? false;
    const fallbackToManual = config?.fallbackToManual ?? true;
    const missingRequirements: string[] = [];

    if (!hasAccessToken) {
      missingRequirements.push('token de acesso');
    }

    if (!hasPhoneNumberId) {
      missingRequirements.push('phone number id');
    }

    if (!hasDestinations) {
      missingRequirements.push('ao menos um destino ativo');
    }

    if (!hasConnectedSession) {
      missingRequirements.push('conexao ativa do WhatsApp');
    }

    const configured = missingRequirements.length === 0;
    const available = enabled && configured;

    return new WhatsappIntegrationStatusResponseDto({
      provider: config?.provider,
      enabled,
      configured,
      available,
      connectionStatus:
        config?.connectionStatus ?? WhatsappConnectionStatus.NOT_CONFIGURED,
      hasAccessToken,
      hasDestinations,
      destinationsCount: activeDestinationsCount,
      fallbackToManual,
      missingRequirements,
      summary: this.buildStatusSummary({
        enabled,
        available,
        configured,
        connectionStatus:
          config?.connectionStatus ?? WhatsappConnectionStatus.NOT_CONFIGURED,
        fallbackToManual,
        missingRequirements,
      }),
    });
  }

  async getConfig(
    currentUser: AuthenticatedUser,
  ): Promise<WhatsappIntegrationConfigResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const config = await this.findConfigByTenantId(tenantId);

    return new WhatsappIntegrationConfigResponseDto(config);
  }

  async updateConfig(
    currentUser: AuthenticatedUser,
    updateWhatsappIntegrationConfigDto: UpdateWhatsappIntegrationConfigDto,
  ): Promise<WhatsappIntegrationConfigResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingConfig = await this.findConfigByTenantId(tenantId);
    // O access token oficial passa a ser controlado apenas pelo onboarding da plataforma.
    const nextAccessToken = existingConfig?.accessToken ?? null;

    const persistedConfig = await this.prisma.$transaction(async (transaction) => {
      if (existingConfig) {
        await transaction.whatsappIntegrationConfig.update({
          where: { tenantId },
          data: this.buildConfigUpdateData(
            existingConfig,
            updateWhatsappIntegrationConfigDto,
            nextAccessToken,
          ),
        });
      } else {
        await transaction.whatsappIntegrationConfig.create({
          data: this.buildConfigCreateData(
            tenantId,
            updateWhatsappIntegrationConfigDto,
            nextAccessToken,
          ),
        });
      }

      if (updateWhatsappIntegrationConfigDto.destinations) {
        await this.whatsappDestinationsService.replaceAllForTenant(
          tenantId,
          updateWhatsappIntegrationConfigDto.destinations,
          transaction,
        );
      }

      return transaction.whatsappIntegrationConfig.findUniqueOrThrow({
        where: { tenantId },
        select: whatsappIntegrationConfigSelect,
      });
    });

    return new WhatsappIntegrationConfigResponseDto(persistedConfig);
  }

  async findConfigByTenantId(
    tenantId: string,
  ): Promise<WhatsappIntegrationConfigEntity | null> {
    return this.prisma.whatsappIntegrationConfig.findUnique({
      where: { tenantId },
      select: whatsappIntegrationConfigSelect,
    });
  }

  private buildConfigCreateData(
    tenantId: string,
    updateWhatsappIntegrationConfigDto: UpdateWhatsappIntegrationConfigDto,
    nextAccessToken: string | null,
  ): Prisma.WhatsappIntegrationConfigUncheckedCreateInput {
    return {
      tenantId,
      enabled: updateWhatsappIntegrationConfigDto.enabled ?? false,
      businessAccountId: this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.businessAccountId,
      ),
      phoneNumberId: this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.phoneNumberId,
      ),
      requestedPhoneNumber: this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.requestedPhoneNumber,
      ),
      accessToken: nextAccessToken,
      fallbackToManual:
        updateWhatsappIntegrationConfigDto.fallbackToManual ?? true,
    };
  }

  private buildConfigUpdateData(
    existingConfig: WhatsappIntegrationConfigEntity,
    updateWhatsappIntegrationConfigDto: UpdateWhatsappIntegrationConfigDto,
    nextAccessToken: string | null,
  ): Prisma.WhatsappIntegrationConfigUncheckedUpdateInput {
    const data: Prisma.WhatsappIntegrationConfigUncheckedUpdateInput = {};

    if (updateWhatsappIntegrationConfigDto.enabled !== undefined) {
      data.enabled = updateWhatsappIntegrationConfigDto.enabled;
    }

    if (updateWhatsappIntegrationConfigDto.businessAccountId !== undefined) {
      data.businessAccountId = this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.businessAccountId,
      );
    }

    if (updateWhatsappIntegrationConfigDto.phoneNumberId !== undefined) {
      data.phoneNumberId = this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.phoneNumberId,
      );
    }

    if (updateWhatsappIntegrationConfigDto.requestedPhoneNumber !== undefined) {
      data.requestedPhoneNumber = this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.requestedPhoneNumber,
      );
    }

    if (
      updateWhatsappIntegrationConfigDto.accessToken !== undefined ||
      updateWhatsappIntegrationConfigDto.clearAccessToken
    ) {
      data.accessToken = existingConfig.accessToken;
    }

    if (updateWhatsappIntegrationConfigDto.fallbackToManual !== undefined) {
      data.fallbackToManual = updateWhatsappIntegrationConfigDto.fallbackToManual;
    }

    if (
      !existingConfig.requestedPhoneNumber &&
      data.requestedPhoneNumber === undefined &&
      updateWhatsappIntegrationConfigDto.phoneNumberId !== undefined
    ) {
      data.requestedPhoneNumber = this.normalizeOptionalString(
        updateWhatsappIntegrationConfigDto.phoneNumberId,
      );
    }

    return data;
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }
  }

  private ensureCanManage(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'A configuracao oficial do WhatsApp esta disponivel apenas para administradores.',
      );
    }
  }

  private ensureTenantAccess(currentUser: AuthenticatedUser): string {
    if (!currentUser.tenantId) {
      throw new ForbiddenException(
        'Acesso permitido apenas para usuarios vinculados a um tenant.',
      );
    }

    return currentUser.tenantId;
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private buildStatusSummary({
    enabled,
    available,
    configured,
    connectionStatus,
    fallbackToManual,
    missingRequirements,
  }: {
    enabled: boolean;
    available: boolean;
    configured: boolean;
    connectionStatus: WhatsappConnectionStatus;
    fallbackToManual: boolean;
    missingRequirements: string[];
  }): string {
    if (available) {
      return 'Integracao oficial pronta para envio automatico pelo WhatsApp, mantendo o fallback manual ativo quando necessario.';
    }

    if (!enabled) {
      return fallbackToManual
        ? 'Integracao oficial cadastrada em modo inativo. O envio manual continua como fallback seguro.'
        : 'Integracao oficial cadastrada em modo inativo.';
    }

    if (!configured) {
      const missingRequirementsLabel = missingRequirements.join(', ');

      if (connectionStatus === WhatsappConnectionStatus.PENDING_AUTHORIZATION) {
        return fallbackToManual
          ? `Integracao oficial aguardando autorizacao. Ajuste ${missingRequirementsLabel}. Enquanto isso, o fluxo manual permanece disponivel.`
          : `Integracao oficial aguardando autorizacao. Ajuste ${missingRequirementsLabel}.`;
      }

      if (connectionStatus === WhatsappConnectionStatus.ERROR) {
        return fallbackToManual
          ? `Integracao oficial com erro de conexao. Ajuste ${missingRequirementsLabel}. Enquanto isso, o fluxo manual permanece disponivel.`
          : `Integracao oficial com erro de conexao. Ajuste ${missingRequirementsLabel}.`;
      }

      return fallbackToManual
        ? `Integracao oficial ainda incompleta. Ajuste ${missingRequirementsLabel}. Enquanto isso, o fluxo manual permanece disponivel.`
        : `Integracao oficial ainda incompleta. Ajuste ${missingRequirementsLabel}.`;
    }

    return 'Integracao oficial em preparacao.';
  }
}
