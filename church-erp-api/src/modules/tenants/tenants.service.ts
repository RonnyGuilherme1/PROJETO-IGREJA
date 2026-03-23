import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantStatus, UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantEntity, tenantSelect } from './types/tenant.type';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll(): Promise<TenantResponseDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      select: tenantSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tenants.map((tenant) => new TenantResponseDto(tenant));
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.findTenantByIdOrThrow(id);

    return new TenantResponseDto(tenant);
  }

  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    await this.ensureUniqueCode(createTenantDto.code);

    if (createTenantDto.adminUser) {
      await this.ensureUniqueUsername(createTenantDto.adminUser.username);
      await this.ensureUniqueEmail(createTenantDto.adminUser.email);
    }

    const passwordHash = createTenantDto.adminUser
      ? await this.authService.hashPassword(createTenantDto.adminUser.password)
      : null;

    const tenant = await this.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: createTenantDto.name,
          slug: createTenantDto.code,
          status: createTenantDto.status ?? TenantStatus.ACTIVE,
        },
        select: tenantSelect,
      });

      if (createTenantDto.adminUser && passwordHash) {
        await tx.user.create({
          data: {
            name: createTenantDto.adminUser.name,
            username: createTenantDto.adminUser.username,
            email: createTenantDto.adminUser.email ?? null,
            passwordHash,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            tenantId: createdTenant.id,
            platformRole: null,
            churchId: null,
          },
        });
      }

      return createdTenant;
    });

    return new TenantResponseDto(tenant);
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const existingTenant = await this.findTenantByIdOrThrow(id);

    if (
      updateTenantDto.code !== undefined &&
      updateTenantDto.code !== existingTenant.slug
    ) {
      await this.ensureUniqueCode(updateTenantDto.code, id);
    }

    const data: Prisma.TenantUpdateInput = {};

    if (updateTenantDto.name !== undefined) {
      data.name = updateTenantDto.name;
    }

    if (updateTenantDto.code !== undefined) {
      data.slug = updateTenantDto.code;
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
      select: tenantSelect,
    });

    return new TenantResponseDto(tenant);
  }

  async inactivate(id: string): Promise<TenantResponseDto> {
    await this.findTenantByIdOrThrow(id);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.INACTIVE,
      },
      select: tenantSelect,
    });

    return new TenantResponseDto(tenant);
  }

  async activate(id: string): Promise<TenantResponseDto> {
    await this.findTenantByIdOrThrow(id);

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.ACTIVE,
      },
      select: tenantSelect,
    });

    return new TenantResponseDto(tenant);
  }

  private async findTenantByIdOrThrow(id: string): Promise<TenantEntity> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: tenantSelect,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant nao encontrado.');
    }

    return tenant;
  }

  private async ensureUniqueCode(
    code: string,
    excludeTenantId?: string,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        slug: {
          equals: code,
          mode: 'insensitive',
        },
        ...(excludeTenantId
          ? {
              id: {
                not: excludeTenantId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (tenant) {
      throw new ConflictException('Ja existe um tenant com este code.');
    }
  }

  private async ensureUniqueUsername(username: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (user) {
      throw new ConflictException('Ja existe um usuario com este username.');
    }
  }

  private async ensureUniqueEmail(email?: string | null): Promise<void> {
    if (!email) {
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (user) {
      throw new ConflictException('Ja existe um usuario com este email.');
    }
  }
}
