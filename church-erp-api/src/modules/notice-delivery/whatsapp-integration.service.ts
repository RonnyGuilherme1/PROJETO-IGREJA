import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateWhatsappIntegrationConfigDto } from './dto/update-whatsapp-integration-config.dto';
import { WhatsappIntegrationConfigResponseDto } from './dto/whatsapp-integration-config-response.dto';
import { WhatsappIntegrationStatusResponseDto } from './dto/whatsapp-integration-status-response.dto';
import {
  WhatsappIntegrationConfigEntity,
  whatsappIntegrationConfigSelect,
} from './types/whatsapp-integration.type';

@Injectable()
export class WhatsappIntegrationService {
  constructor(private readonly prisma: PrismaService) {}

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

    const configured = missingRequirements.length === 0;
    const available = enabled && configured;

    return new WhatsappIntegrationStatusResponseDto({
      provider: config?.provider,
      enabled,
      configured,
      available,
      hasAccessToken,
      hasDestinations,
      destinationsCount: activeDestinationsCount,
      fallbackToManual,
      missingRequirements,
      summary: this.buildStatusSummary({
        enabled,
        available,
        configured,
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
    const normalizedDestinations =
      updateWhatsappIntegrationConfigDto.destinations?.map((destination) => ({
        label: destination.label.trim(),
        phoneNumber: this.normalizeWhatsappPhoneNumber(destination.phoneNumber),
        enabled: destination.enabled ?? true,
      })) ?? null;

    this.ensureNoDuplicateDestinations(normalizedDestinations);

    const nextAccessToken = updateWhatsappIntegrationConfigDto.clearAccessToken
      ? null
      : updateWhatsappIntegrationConfigDto.accessToken !== undefined
        ? this.normalizeOptionalString(updateWhatsappIntegrationConfigDto.accessToken)
        : existingConfig?.accessToken ?? null;

    const persistedConfig = await this.prisma.$transaction(async (transaction) => {
      const baseData: Prisma.WhatsappIntegrationConfigUncheckedCreateInput = {
        tenantId,
        enabled: updateWhatsappIntegrationConfigDto.enabled ?? false,
        businessAccountId: this.normalizeOptionalString(
          updateWhatsappIntegrationConfigDto.businessAccountId,
        ),
        phoneNumberId: this.normalizeOptionalString(
          updateWhatsappIntegrationConfigDto.phoneNumberId,
        ),
        accessToken: nextAccessToken,
        fallbackToManual:
          updateWhatsappIntegrationConfigDto.fallbackToManual ?? true,
      };

      if (existingConfig) {
        await transaction.whatsappIntegrationConfig.update({
          where: { tenantId },
          data: {
            ...(updateWhatsappIntegrationConfigDto.enabled !== undefined
              ? { enabled: updateWhatsappIntegrationConfigDto.enabled }
              : {}),
            ...(updateWhatsappIntegrationConfigDto.businessAccountId !== undefined
              ? {
                  businessAccountId: this.normalizeOptionalString(
                    updateWhatsappIntegrationConfigDto.businessAccountId,
                  ),
                }
              : {}),
            ...(updateWhatsappIntegrationConfigDto.phoneNumberId !== undefined
              ? {
                  phoneNumberId: this.normalizeOptionalString(
                    updateWhatsappIntegrationConfigDto.phoneNumberId,
                  ),
                }
              : {}),
            ...(updateWhatsappIntegrationConfigDto.accessToken !== undefined ||
            updateWhatsappIntegrationConfigDto.clearAccessToken
              ? { accessToken: nextAccessToken }
              : {}),
            ...(updateWhatsappIntegrationConfigDto.fallbackToManual !== undefined
              ? {
                  fallbackToManual:
                    updateWhatsappIntegrationConfigDto.fallbackToManual,
                }
              : {}),
          },
        });
      } else {
        await transaction.whatsappIntegrationConfig.create({
          data: baseData,
        });
      }

      if (normalizedDestinations) {
        const configRecord = await transaction.whatsappIntegrationConfig.findUniqueOrThrow(
          {
            where: { tenantId },
            select: { id: true },
          },
        );

        await transaction.whatsappIntegrationDestination.deleteMany({
          where: { configId: configRecord.id },
        });

        if (normalizedDestinations.length > 0) {
          await transaction.whatsappIntegrationDestination.createMany({
            data: normalizedDestinations.map((destination) => ({
              configId: configRecord.id,
              label: destination.label,
              phoneNumber: destination.phoneNumber,
              enabled: destination.enabled,
            })),
          });
        }
      }

      return transaction.whatsappIntegrationConfig.findUniqueOrThrow({
        where: { tenantId },
        select: whatsappIntegrationConfigSelect,
      });
    });

    return new WhatsappIntegrationConfigResponseDto(persistedConfig);
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

  private async findConfigByTenantId(
    tenantId: string,
  ): Promise<WhatsappIntegrationConfigEntity | null> {
    return this.prisma.whatsappIntegrationConfig.findUnique({
      where: { tenantId },
      select: whatsappIntegrationConfigSelect,
    });
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private normalizeWhatsappPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      throw new BadRequestException(
        'Informe um numero de destino em formato internacional com 10 a 15 digitos.',
      );
    }

    return `+${digits}`;
  }

  private ensureNoDuplicateDestinations(
    destinations: Array<{ label: string; phoneNumber: string; enabled: boolean }> | null,
  ): void {
    if (!destinations) {
      return;
    }

    const labels = new Set<string>();
    const phoneNumbers = new Set<string>();

    destinations.forEach((destination) => {
      const normalizedLabel = destination.label.trim().toLowerCase();

      if (labels.has(normalizedLabel)) {
        throw new BadRequestException(
          'Existem destinos duplicados com o mesmo nome.',
        );
      }

      if (phoneNumbers.has(destination.phoneNumber)) {
        throw new BadRequestException(
          'Existem destinos duplicados com o mesmo numero.',
        );
      }

      labels.add(normalizedLabel);
      phoneNumbers.add(destination.phoneNumber);
    });
  }

  private buildStatusSummary({
    enabled,
    available,
    configured,
    fallbackToManual,
    missingRequirements,
  }: {
    enabled: boolean;
    available: boolean;
    configured: boolean;
    fallbackToManual: boolean;
    missingRequirements: string[];
  }): string {
    if (available) {
      return 'Integracao oficial pronta para ser conectada a um fluxo futuro de envio desacoplado, mantendo o fallback manual ativo.';
    }

    if (!enabled) {
      return fallbackToManual
        ? 'Integracao oficial cadastrada em modo inativo. O envio manual continua como fallback seguro.'
        : 'Integracao oficial cadastrada em modo inativo.';
    }

    if (!configured) {
      const missingRequirementsLabel = missingRequirements.join(', ');

      return fallbackToManual
        ? `Integracao oficial ainda incompleta. Ajuste ${missingRequirementsLabel}. Enquanto isso, o fluxo manual permanece disponivel.`
        : `Integracao oficial ainda incompleta. Ajuste ${missingRequirementsLabel}.`;
    }

    return 'Integracao oficial em preparacao.';
  }
}
