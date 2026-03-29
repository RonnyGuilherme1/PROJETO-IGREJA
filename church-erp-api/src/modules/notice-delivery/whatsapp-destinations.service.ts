import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  UserRole,
  WhatsappDestinationType,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateWhatsappDestinationDto } from './dto/create-whatsapp-destination.dto';
import { UpdateWhatsappDestinationDto } from './dto/update-whatsapp-destination.dto';
import { WhatsappDestinationResponseDto } from './dto/whatsapp-destination-response.dto';
import {
  WhatsappDestinationEntity,
  whatsappIntegrationDestinationSelect,
} from './types/whatsapp-integration.type';

type PrismaExecutor = Prisma.TransactionClient | PrismaService;

interface NormalizedWhatsappDestinationInput {
  label: string;
  type: WhatsappDestinationType;
  churchId: string | null;
  groupId: string | null;
  phoneNumber: string | null;
  enabled: boolean;
}

@Injectable()
export class WhatsappDestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
  ): Promise<WhatsappDestinationResponseDto[]> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const config = await this.prisma.whatsappIntegrationConfig.findUnique({
      where: { tenantId },
      select: { id: true },
    });

    if (!config) {
      return [];
    }

    const destinations = await this.prisma.whatsappIntegrationDestination.findMany({
      where: { configId: config.id },
      select: whatsappIntegrationDestinationSelect,
      orderBy: [{ enabled: 'desc' }, { label: 'asc' }, { createdAt: 'asc' }],
    });

    return destinations.map(
      (destination) => new WhatsappDestinationResponseDto(destination),
    );
  }

  async create(
    currentUser: AuthenticatedUser,
    createWhatsappDestinationDto: CreateWhatsappDestinationDto,
  ): Promise<WhatsappDestinationResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const destination = await this.prisma.$transaction(async (transaction) => {
      const configId = await this.ensureConfigId(transaction, tenantId);
      const normalizedDestination =
        await this.normalizeDestinationInput(
          transaction,
          tenantId,
          createWhatsappDestinationDto,
        );

      await this.ensureDestinationUniqueness(
        transaction,
        configId,
        normalizedDestination,
      );

      return transaction.whatsappIntegrationDestination.create({
        data: {
          configId,
          ...normalizedDestination,
        },
        select: whatsappIntegrationDestinationSelect,
      });
    });

    return new WhatsappDestinationResponseDto(destination);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateWhatsappDestinationDto: UpdateWhatsappDestinationDto,
  ): Promise<WhatsappDestinationResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingDestination = await this.findDestinationByIdForTenantOrThrow(
      tenantId,
      id,
    );

    const destination = await this.prisma.$transaction(async (transaction) => {
      const normalizedDestination =
        await this.normalizeDestinationUpdateInput(
          transaction,
          tenantId,
          existingDestination,
          updateWhatsappDestinationDto,
        );

      await this.ensureDestinationUniqueness(
        transaction,
        existingDestination.configId,
        normalizedDestination,
        existingDestination.id,
      );

      return transaction.whatsappIntegrationDestination.update({
        where: { id: existingDestination.id },
        data: normalizedDestination,
        select: whatsappIntegrationDestinationSelect,
      });
    });

    return new WhatsappDestinationResponseDto(destination);
  }

  async inactivate(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<WhatsappDestinationResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findDestinationByIdForTenantOrThrow(tenantId, id);

    const destination = await this.prisma.whatsappIntegrationDestination.update({
      where: { id },
      data: {
        enabled: false,
      },
      select: whatsappIntegrationDestinationSelect,
    });

    return new WhatsappDestinationResponseDto(destination);
  }

  async replaceAllForTenant(
    tenantId: string,
    destinations: CreateWhatsappDestinationDto[],
    executor: PrismaExecutor = this.prisma,
  ): Promise<void> {
    const configId = await this.ensureConfigId(executor, tenantId);
    const normalizedDestinations: NormalizedWhatsappDestinationInput[] = [];

    for (const destination of destinations) {
      normalizedDestinations.push(
        await this.normalizeDestinationInput(executor, tenantId, destination),
      );
    }

    this.ensureNoDuplicateDestinations(normalizedDestinations);

    await executor.whatsappIntegrationDestination.deleteMany({
      where: { configId },
    });

    if (normalizedDestinations.length === 0) {
      return;
    }

    await executor.whatsappIntegrationDestination.createMany({
      data: normalizedDestinations.map((destination) => ({
        configId,
        ...destination,
      })),
    });
  }

  async findDestinationByIdForTenantOrThrow(
    tenantId: string,
    destinationId: string,
  ): Promise<WhatsappDestinationEntity> {
    const destination =
      await this.prisma.whatsappIntegrationDestination.findFirst({
        where: {
          id: destinationId,
          config: {
            is: {
              tenantId,
            },
          },
        },
        select: whatsappIntegrationDestinationSelect,
      });

    if (!destination) {
      throw new NotFoundException('Destino do WhatsApp nao encontrado.');
    }

    return destination;
  }

  private async normalizeDestinationInput(
    executor: PrismaExecutor,
    tenantId: string,
    destination:
      | CreateWhatsappDestinationDto
      | UpdateWhatsappDestinationDto
      | NormalizedWhatsappDestinationInput,
  ): Promise<NormalizedWhatsappDestinationInput> {
    const type = destination.type ?? WhatsappDestinationType.PERSON;
    const label = this.normalizeRequiredLabel(destination.label);
    const churchId = this.normalizeOptionalString(destination.churchId);
    const enabled = destination.enabled ?? true;

    if (churchId) {
      await this.ensureChurchExists(executor, tenantId, churchId);
    }

    if (type === WhatsappDestinationType.GROUP) {
      return {
        label,
        type,
        churchId,
        groupId: this.normalizeRequiredGroupId(destination.groupId),
        phoneNumber: null,
        enabled,
      };
    }

    return {
      label,
      type,
      churchId,
      groupId: null,
      phoneNumber: this.normalizeRequiredWhatsappPhoneNumber(
        destination.phoneNumber,
      ),
      enabled,
    };
  }

  private async normalizeDestinationUpdateInput(
    executor: PrismaExecutor,
    tenantId: string,
    existingDestination: WhatsappDestinationEntity,
    updateWhatsappDestinationDto: UpdateWhatsappDestinationDto,
  ): Promise<NormalizedWhatsappDestinationInput> {
    const nextType =
      updateWhatsappDestinationDto.type ?? existingDestination.type;
    const nextLabel =
      updateWhatsappDestinationDto.label ?? existingDestination.label;
    const nextChurchId =
      'churchId' in updateWhatsappDestinationDto
        ? updateWhatsappDestinationDto.churchId
        : existingDestination.churchId;
    const nextGroupId =
      'groupId' in updateWhatsappDestinationDto
        ? updateWhatsappDestinationDto.groupId
        : existingDestination.groupId;
    const nextPhoneNumber =
      'phoneNumber' in updateWhatsappDestinationDto
        ? updateWhatsappDestinationDto.phoneNumber
        : existingDestination.phoneNumber;
    const nextEnabled =
      updateWhatsappDestinationDto.enabled ?? existingDestination.enabled;

    return this.normalizeDestinationInput(executor, tenantId, {
      label: nextLabel,
      type: nextType,
      churchId: nextChurchId,
      groupId: nextGroupId,
      phoneNumber: nextPhoneNumber,
      enabled: nextEnabled,
    });
  }

  private async ensureConfigId(
    executor: PrismaExecutor,
    tenantId: string,
  ): Promise<string> {
    const existingConfig = await executor.whatsappIntegrationConfig.findUnique({
      where: { tenantId },
      select: { id: true },
    });

    if (existingConfig) {
      return existingConfig.id;
    }

    const createdConfig = await executor.whatsappIntegrationConfig.create({
      data: {
        tenantId,
      },
      select: { id: true },
    });

    return createdConfig.id;
  }

  private async ensureDestinationUniqueness(
    executor: PrismaExecutor,
    configId: string,
    destination: NormalizedWhatsappDestinationInput,
    excludeId?: string,
  ): Promise<void> {
    const existingDestinations =
      await executor.whatsappIntegrationDestination.findMany({
        where: {
          configId,
          ...(excludeId
            ? {
                id: {
                  not: excludeId,
                },
              }
            : {}),
        },
        select: {
          label: true,
          groupId: true,
          phoneNumber: true,
        },
      });

    const normalizedLabel = this.normalizeLabelForComparison(destination.label);

    if (
      existingDestinations.some(
        (existingDestination) =>
          this.normalizeLabelForComparison(existingDestination.label) ===
          normalizedLabel,
      )
    ) {
      throw new BadRequestException(
        'Ja existe um destino do WhatsApp com o mesmo nome.',
      );
    }

    if (
      destination.groupId &&
      existingDestinations.some(
        (existingDestination) =>
          existingDestination.groupId === destination.groupId,
      )
    ) {
      throw new BadRequestException(
        'Ja existe um destino do WhatsApp com o mesmo groupId.',
      );
    }

    if (
      destination.phoneNumber &&
      existingDestinations.some(
        (existingDestination) =>
          existingDestination.phoneNumber === destination.phoneNumber,
      )
    ) {
      throw new BadRequestException(
        'Ja existe um destino do WhatsApp com o mesmo phoneNumber.',
      );
    }
  }

  private ensureNoDuplicateDestinations(
    destinations: NormalizedWhatsappDestinationInput[],
  ): void {
    const labels = new Set<string>();
    const groupIds = new Set<string>();
    const phoneNumbers = new Set<string>();

    destinations.forEach((destination) => {
      const normalizedLabel = this.normalizeLabelForComparison(destination.label);

      if (labels.has(normalizedLabel)) {
        throw new BadRequestException(
          'Existem destinos duplicados com o mesmo nome.',
        );
      }

      labels.add(normalizedLabel);

      if (destination.groupId) {
        if (groupIds.has(destination.groupId)) {
          throw new BadRequestException(
            'Existem destinos duplicados com o mesmo groupId.',
          );
        }

        groupIds.add(destination.groupId);
      }

      if (destination.phoneNumber) {
        if (phoneNumbers.has(destination.phoneNumber)) {
          throw new BadRequestException(
            'Existem destinos duplicados com o mesmo phoneNumber.',
          );
        }

        phoneNumbers.add(destination.phoneNumber);
      }
    });
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

  private async ensureChurchExists(
    executor: PrismaExecutor,
    tenantId: string,
    churchId: string,
  ): Promise<void> {
    const church = await executor.church.findFirst({
      where: {
        id: churchId,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (!church) {
      throw new NotFoundException('Igreja vinculada nao encontrada.');
    }
  }

  private normalizeRequiredLabel(label?: string | null): string {
    const normalizedLabel = this.normalizeOptionalString(label);

    if (!normalizedLabel || normalizedLabel.length < 2) {
      throw new BadRequestException(
        'Informe um nome valido para o destino do WhatsApp.',
      );
    }

    return normalizedLabel;
  }

  private normalizeRequiredGroupId(groupId?: string | null): string {
    const normalizedGroupId = this.normalizeOptionalString(groupId);

    if (!normalizedGroupId) {
      throw new BadRequestException(
        'Destinos do tipo grupo exigem um groupId valido.',
      );
    }

    return normalizedGroupId;
  }

  private normalizeRequiredWhatsappPhoneNumber(
    phoneNumber?: string | null,
  ): string {
    if (typeof phoneNumber !== 'string') {
      throw new BadRequestException(
        'Destinos do tipo pessoa exigem um phoneNumber valido.',
      );
    }

    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      throw new BadRequestException(
        'Informe um numero de destino em formato internacional com 10 a 15 digitos.',
      );
    }

    return `+${digits}`;
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private normalizeLabelForComparison(label: string): string {
    return label.trim().toLocaleLowerCase('pt-BR');
  }
}
