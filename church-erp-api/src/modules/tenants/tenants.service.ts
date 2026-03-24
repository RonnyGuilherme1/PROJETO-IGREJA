import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantStatus, UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DEFAULT_FINANCE_CATEGORIES } from '../finance/finance.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantEntity, tenantSelect } from './types/tenant.type';

@Injectable()
export class TenantsService {
  private static readonly INITIAL_TENANT_CODE = 1001;
  private static readonly MAX_CODE_GENERATION_ATTEMPTS = 5;

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
    if (createTenantDto.adminUser) {
      await this.ensureUniqueUsername(createTenantDto.adminUser.username);
      await this.ensureUniqueEmail(createTenantDto.adminUser.email);
    }

    const passwordHash = createTenantDto.adminUser
      ? await this.authService.hashPassword(createTenantDto.adminUser.password)
      : null;

    const tenant = await this.createTenantWithGeneratedCode(
      createTenantDto,
      passwordHash,
    );

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
      throw new NotFoundException('Banco nao encontrado.');
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
      throw new ConflictException('Ja existe um banco com este codigo.');
    }
  }

  private async createTenantWithGeneratedCode(
    createTenantDto: CreateTenantDto,
    passwordHash: string | null,
  ): Promise<TenantEntity> {
    for (
      let attempt = 0;
      attempt < TenantsService.MAX_CODE_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const generatedCode = await this.getNextTenantCode(tx);
            const createdTenant = await tx.tenant.create({
              data: {
                name: createTenantDto.name,
                slug: generatedCode,
                status: createTenantDto.status ?? TenantStatus.ACTIVE,
              },
              select: tenantSelect,
            });

            await this.ensureDefaultFinanceCategories(tx, createdTenant.id);

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
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (this.shouldRetryCodeGeneration(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Nao foi possivel gerar um codigo unico para o banco.',
    );
  }

  private async getNextTenantCode(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const result = await tx.$queryRaw<Array<{ nextCode: bigint | number }>>`
      SELECT GREATEST(
        COALESCE(MAX(CAST("slug" AS INTEGER)), ${TenantsService.INITIAL_TENANT_CODE - 1}),
        ${TenantsService.INITIAL_TENANT_CODE - 1}
      ) + 1 AS "nextCode"
      FROM "Tenant"
      WHERE "slug" ~ '^[0-9]+$'
    `;

    const nextCode = result[0]?.nextCode;

    if (typeof nextCode === 'bigint') {
      return nextCode.toString();
    }

    if (typeof nextCode === 'number' && Number.isFinite(nextCode)) {
      return String(nextCode);
    }

    return String(TenantsService.INITIAL_TENANT_CODE);
  }

  private shouldRetryCodeGeneration(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2002', 'P2034'].includes(error.code)
    );
  }

  private async ensureDefaultFinanceCategories(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<void> {
    const existingCategories = await tx.financeCategory.findMany({
      where: {
        tenantId,
        OR: DEFAULT_FINANCE_CATEGORIES.map((category) => ({
          name: {
            equals: category.name,
            mode: 'insensitive',
          },
          type: category.type,
        })),
      },
      select: {
        name: true,
        type: true,
      },
    });

    const existingCategoryKeys = new Set(
      existingCategories.map(
        (category) => `${category.type}:${category.name.trim().toLowerCase()}`,
      ),
    );

    const missingCategories = DEFAULT_FINANCE_CATEGORIES.filter(
      (category) =>
        !existingCategoryKeys.has(
          `${category.type}:${category.name.trim().toLowerCase()}`,
        ),
    );

    if (missingCategories.length === 0) {
      return;
    }

    await tx.financeCategory.createMany({
      data: missingCategories.map((category) => ({
        tenantId,
        name: category.name,
        type: category.type,
        active: true,
      })),
    });
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
