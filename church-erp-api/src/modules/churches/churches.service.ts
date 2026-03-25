import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChurchStatus, Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateChurchDto } from './dto/create-church.dto';
import { ChurchResponseDto } from './dto/church-response.dto';
import { UpdateChurchDto } from './dto/update-church.dto';
import { ChurchEntity, churchSelect } from './types/church.type';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5000;
const CHURCH_STATUS_VALUES = new Set<string>(Object.values(ChurchStatus));
const TENANT_VIEW_ROLES = new Set<UserRole>(Object.values(UserRole));
const CHURCH_MANAGE_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.SECRETARIA,
]);

type CurrentUserWithPlatformRole = AuthenticatedUser & {
  platformRole?: string | null;
};

interface FindChurchesQuery {
  page?: number;
  limit?: number;
  name?: string;
  status?: string;
}

interface ChurchesListResult {
  items: ChurchResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ChurchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
    query: FindChurchesQuery,
  ): Promise<ChurchesListResult> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
    const limit = query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT;

    if (query.status !== undefined && !this.isChurchStatus(query.status)) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const where = this.buildWhere(query, tenantId);
    const skip = (page - 1) * limit;

    const [churches, total] = await this.prisma.$transaction([
      this.prisma.church.findMany({
        where,
        select: churchSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.church.count({ where }),
    ]);

    return {
      items: churches.map((church) => new ChurchResponseDto(church)),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<ChurchResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const church = await this.findChurchByIdOrThrow(id, tenantId);

    return new ChurchResponseDto(church);
  }

  async create(
    currentUser: AuthenticatedUser,
    createChurchDto: CreateChurchDto,
  ): Promise<ChurchResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const church = await this.prisma.church.create({
      data: {
        tenantId,
        name: createChurchDto.name,
        cnpj: createChurchDto.cnpj ?? null,
        phone: createChurchDto.phone ?? null,
        email: createChurchDto.email ?? null,
        address: createChurchDto.address ?? null,
        pastorName: createChurchDto.pastorName ?? null,
        status: createChurchDto.status ?? ChurchStatus.ACTIVE,
        notes: createChurchDto.notes ?? null,
      },
      select: churchSelect,
    });

    return new ChurchResponseDto(church);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateChurchDto: UpdateChurchDto,
  ): Promise<ChurchResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findChurchByIdOrThrow(id, tenantId);

    const data: Prisma.ChurchUpdateInput = {};

    if (updateChurchDto.name !== undefined) {
      data.name = updateChurchDto.name;
    }

    if ('cnpj' in updateChurchDto) {
      data.cnpj = updateChurchDto.cnpj ?? null;
    }

    if ('phone' in updateChurchDto) {
      data.phone = updateChurchDto.phone ?? null;
    }

    if ('email' in updateChurchDto) {
      data.email = updateChurchDto.email ?? null;
    }

    if ('address' in updateChurchDto) {
      data.address = updateChurchDto.address ?? null;
    }

    if ('pastorName' in updateChurchDto) {
      data.pastorName = updateChurchDto.pastorName ?? null;
    }

    if (updateChurchDto.status !== undefined) {
      data.status = updateChurchDto.status;
    }

    if ('notes' in updateChurchDto) {
      data.notes = updateChurchDto.notes ?? null;
    }

    const church = await this.prisma.church.update({
      where: { id },
      data,
      select: churchSelect,
    });

    return new ChurchResponseDto(church);
  }

  async inactivate(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<ChurchResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findChurchByIdOrThrow(id, tenantId);

    const church = await this.prisma.church.update({
      where: { id },
      data: {
        status: ChurchStatus.INACTIVE,
      },
      select: churchSelect,
    });

    return new ChurchResponseDto(church);
  }

  private buildWhere(
    query: FindChurchesQuery,
    tenantId: string,
  ): Prisma.ChurchWhereInput {
    const where: Prisma.ChurchWhereInput = {
      tenantId,
    };

    if (query.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive',
      };
    }

    if (query.status && this.isChurchStatus(query.status)) {
      where.status = query.status;
    }

    return where;
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    this.ensureTenantRole(
      currentUser,
      TENANT_VIEW_ROLES,
      'Acesso permitido apenas para perfis do tenant.',
    );
  }

  private ensureCanManage(currentUser: AuthenticatedUser): void {
    this.ensureTenantRole(
      currentUser,
      CHURCH_MANAGE_ROLES,
      'Acesso permitido apenas para administradores e secretaria.',
    );
  }

  private ensureTenantRole(
    currentUser: AuthenticatedUser,
    allowedRoles: ReadonlySet<UserRole>,
    message: string,
  ): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }

    if (this.isPlatformUser(currentUser) || !allowedRoles.has(currentUser.role)) {
      throw new ForbiddenException(message);
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

  private async findChurchByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<ChurchEntity> {
    const church = await this.prisma.church.findFirst({
      where: {
        id,
        tenantId,
      },
      select: churchSelect,
    });

    if (!church) {
      throw new NotFoundException('Igreja nao encontrada.');
    }

    return church;
  }

  private isChurchStatus(value: string): value is ChurchStatus {
    return CHURCH_STATUS_VALUES.has(value);
  }

  private isPlatformUser(currentUser: AuthenticatedUser): boolean {
    return Boolean(
      (currentUser as CurrentUserWithPlatformRole).platformRole,
    );
  }
}
