import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { Prisma, TenantStatus, UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DEFAULT_FINANCE_CATEGORIES } from '../finance/finance.service';
import {
  TENANT_LOGO_ALLOWED_EXTENSIONS,
  TENANT_LOGO_ALLOWED_MIME_TYPES,
  TENANT_LOGO_MAX_FILE_SIZE,
  TENANT_LOGO_PUBLIC_BASE_PATH,
  TENANT_LOGO_UPLOAD_DIRECTORY,
} from './constants/tenant-logo-upload.constants';
import { DEFAULT_TENANT_THEME_KEY } from './constants/tenant-theme.constants';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantEntity, tenantSelect } from './types/tenant.type';
import { UploadedTenantLogoFile } from './types/uploaded-tenant-logo-file.type';

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

  async findCurrent(
    currentUser: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    const tenantId = this.ensureTenantAdminAccess(currentUser);
    const tenant = await this.findTenantByIdOrThrow(tenantId);

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

    if (updateTenantDto.status !== undefined) {
      data.status = updateTenantDto.status;
    }

    if (updateTenantDto.logoUrl !== undefined) {
      data.logoUrl = this.normalizeLogoUrl(updateTenantDto.logoUrl);
    }

    if (updateTenantDto.themeKey !== undefined) {
      data.themeKey = updateTenantDto.themeKey;
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data,
      select: tenantSelect,
    });

    await this.deleteManagedLogoIfReplaced(
      existingTenant.logoUrl,
      tenant.logoUrl,
    );

    return new TenantResponseDto(tenant);
  }

  async updateCurrentBranding(
    currentUser: AuthenticatedUser,
    updateTenantBrandingDto: UpdateTenantBrandingDto,
  ): Promise<TenantResponseDto> {
    const tenantId = this.ensureTenantAdminAccess(currentUser);
    const existingTenant = await this.findTenantByIdOrThrow(tenantId);

    const data: Prisma.TenantUpdateInput = {};

    if (updateTenantBrandingDto.logoUrl !== undefined) {
      data.logoUrl = this.normalizeLogoUrl(updateTenantBrandingDto.logoUrl);
    }

    if (updateTenantBrandingDto.themeKey !== undefined) {
      data.themeKey = updateTenantBrandingDto.themeKey;
    }

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: tenantSelect,
    });

    await this.deleteManagedLogoIfReplaced(
      existingTenant.logoUrl,
      tenant.logoUrl,
    );

    return new TenantResponseDto(tenant);
  }

  async uploadCurrentLogo(
    currentUser: AuthenticatedUser,
    file?: UploadedTenantLogoFile,
  ): Promise<{ logoUrl: string }> {
    const tenantId = this.ensureTenantAdminAccess(currentUser);
    await this.findTenantByIdOrThrow(tenantId);

    return this.uploadLogoForTenant(tenantId, file);
  }

  async uploadLogoByMaster(
    id: string,
    file?: UploadedTenantLogoFile,
  ): Promise<{ logoUrl: string }> {
    await this.findTenantByIdOrThrow(id);

    return this.uploadLogoForTenant(id, file);
  }

  private async uploadLogoForTenant(
    tenantId: string,
    file?: UploadedTenantLogoFile,
  ): Promise<{ logoUrl: string }> {
    const validatedFile = this.validateTenantLogoFile(file);
    const filename = await this.saveTenantLogoFile(tenantId, validatedFile);

    return {
      logoUrl: `${TENANT_LOGO_PUBLIC_BASE_PATH}/${filename}`,
    };
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
      throw new ConflictException('Ja existe um tenant com este codigo.');
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
                logoUrl: this.normalizeLogoUrl(createTenantDto.logoUrl),
                themeKey:
                  createTenantDto.themeKey ?? DEFAULT_TENANT_THEME_KEY,
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
      'Nao foi possivel gerar um codigo unico para o tenant.',
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

  private ensureTenantAdminAccess(currentUser: AuthenticatedUser): string {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Acesso permitido apenas para administradores.',
      );
    }

    if (!currentUser.tenantId) {
      throw new ForbiddenException(
        'Acesso permitido apenas para usuarios vinculados a um tenant.',
      );
    }

    return currentUser.tenantId;
  }

  private normalizeLogoUrl(logoUrl?: string | null): string | null {
    if (typeof logoUrl !== 'string') {
      return null;
    }

    const trimmedLogoUrl = logoUrl.trim();

    return trimmedLogoUrl.length > 0 ? trimmedLogoUrl : null;
  }

  private validateTenantLogoFile(
    file?: UploadedTenantLogoFile,
  ): UploadedTenantLogoFile {
    if (!file) {
      throw new BadRequestException('Envie o arquivo da logo do tenant.');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('O arquivo enviado para a logo esta vazio.');
    }

    if (file.size > TENANT_LOGO_MAX_FILE_SIZE) {
      throw new BadRequestException(
        'A logo do tenant deve ter no maximo 1 MB.',
      );
    }

    const normalizedMimeType = String(file.mimetype ?? '').trim().toLowerCase();
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    const hasAllowedMimeType =
      normalizedMimeType.length > 0 &&
      TENANT_LOGO_ALLOWED_MIME_TYPES.has(normalizedMimeType);
    const hasAllowedExtension =
      normalizedExtension.length > 0 &&
      TENANT_LOGO_ALLOWED_EXTENSIONS.has(normalizedExtension);

    if (
      (normalizedMimeType && !hasAllowedMimeType) ||
      (normalizedExtension && !hasAllowedExtension) ||
      (!normalizedMimeType && !hasAllowedExtension)
    ) {
      throw new BadRequestException(
        'A logo do tenant deve ser PNG, JPG, JPEG ou WEBP.',
      );
    }

    return file;
  }

  private async saveTenantLogoFile(
    tenantId: string,
    file: UploadedTenantLogoFile,
  ): Promise<string> {
    const extension = this.resolveTenantLogoExtension(file);
    const safeTenantId = tenantId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const filename = `${safeTenantId}-${Date.now()}-${randomUUID()}.${extension}`;
    const destination = join(TENANT_LOGO_UPLOAD_DIRECTORY, filename);

    await mkdir(TENANT_LOGO_UPLOAD_DIRECTORY, { recursive: true });
    await writeFile(destination, file.buffer);

    return filename;
  }

  private resolveTenantLogoExtension(file: UploadedTenantLogoFile): string {
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    if (TENANT_LOGO_ALLOWED_EXTENSIONS.has(normalizedExtension)) {
      return normalizedExtension.slice(1);
    }

    switch (String(file.mimetype ?? '').trim().toLowerCase()) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/jpeg':
        return 'jpg';
      default:
        throw new BadRequestException(
          'Nao foi possivel determinar a extensao da logo enviada.',
        );
    }
  }

  private async deleteManagedLogoIfReplaced(
    previousLogoUrl?: string | null,
    nextLogoUrl?: string | null,
  ): Promise<void> {
    const previousFilePath = this.resolveManagedLogoFilePath(previousLogoUrl);
    const normalizedPreviousLogoUrl = this.normalizeLogoUrl(previousLogoUrl);
    const normalizedNextLogoUrl = this.normalizeLogoUrl(nextLogoUrl);

    if (
      !previousFilePath ||
      normalizedPreviousLogoUrl === normalizedNextLogoUrl
    ) {
      return;
    }

    try {
      await unlink(previousFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveManagedLogoFilePath(logoUrl?: string | null): string | null {
    const normalizedLogoUrl = this.normalizeLogoUrl(logoUrl);

    if (
      !normalizedLogoUrl ||
      !normalizedLogoUrl.startsWith(`${TENANT_LOGO_PUBLIC_BASE_PATH}/`)
    ) {
      return null;
    }

    const filename = normalizedLogoUrl.slice(
      TENANT_LOGO_PUBLIC_BASE_PATH.length + 1,
    );

    if (!filename || filename !== basename(filename)) {
      return null;
    }

    return join(TENANT_LOGO_UPLOAD_DIRECTORY, filename);
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
