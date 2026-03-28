import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateLeadershipRoleDto } from './dto/create-leadership-role.dto';
import { LeadershipRoleResponseDto } from './dto/leadership-role-response.dto';
import { UpdateLeadershipRoleDto } from './dto/update-leadership-role.dto';
import {
  LeadershipRoleEntity,
  leadershipRoleSelect,
} from './types/leadership-role.type';

@Injectable()
export class LeadershipRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
  ): Promise<LeadershipRoleResponseDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const leadershipRoles = await this.prisma.leadershipRole.findMany({
      where: {
        tenantId,
      },
      select: leadershipRoleSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    return leadershipRoles.map(
      (leadershipRole) => new LeadershipRoleResponseDto(leadershipRole),
    );
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<LeadershipRoleResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const leadershipRole = await this.findLeadershipRoleByIdOrThrow(id, tenantId);

    return new LeadershipRoleResponseDto(leadershipRole);
  }

  async create(
    currentUser: AuthenticatedUser,
    createLeadershipRoleDto: CreateLeadershipRoleDto,
  ): Promise<LeadershipRoleResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.ensureUniqueName(createLeadershipRoleDto.name, tenantId);

    const leadershipRole = await this.prisma.leadershipRole.create({
      data: {
        tenantId,
        name: createLeadershipRoleDto.name,
        description: createLeadershipRoleDto.description ?? null,
        active: createLeadershipRoleDto.active ?? true,
      },
      select: leadershipRoleSelect,
    });

    return new LeadershipRoleResponseDto(leadershipRole);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateLeadershipRoleDto: UpdateLeadershipRoleDto,
  ): Promise<LeadershipRoleResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findLeadershipRoleByIdOrThrow(id, tenantId);

    if (updateLeadershipRoleDto.name !== undefined) {
      await this.ensureUniqueName(updateLeadershipRoleDto.name, tenantId, id);
    }

    const data: Prisma.LeadershipRoleUpdateInput = {};

    if (updateLeadershipRoleDto.name !== undefined) {
      data.name = updateLeadershipRoleDto.name;
    }

    if ('description' in updateLeadershipRoleDto) {
      data.description = updateLeadershipRoleDto.description ?? null;
    }

    if (updateLeadershipRoleDto.active !== undefined) {
      data.active = updateLeadershipRoleDto.active;
    }

    const leadershipRole = await this.prisma.leadershipRole.update({
      where: { id },
      data,
      select: leadershipRoleSelect,
    });

    return new LeadershipRoleResponseDto(leadershipRole);
  }

  async inactivate(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<LeadershipRoleResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findLeadershipRoleByIdOrThrow(id, tenantId);

    const leadershipRole = await this.prisma.leadershipRole.update({
      where: { id },
      data: {
        active: false,
      },
      select: leadershipRoleSelect,
    });

    return new LeadershipRoleResponseDto(leadershipRole);
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }
  }

  private ensureCanManage(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SECRETARIA
    ) {
      throw new ForbiddenException(
        'Acesso permitido apenas para administradores e secretaria.',
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

  private async ensureUniqueName(
    name: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<void> {
    const existingLeadershipRole = await this.prisma.leadershipRole.findFirst({
      where: {
        tenantId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingLeadershipRole) {
      throw new ConflictException(
        'Ja existe um cargo de lideranca com este nome.',
      );
    }
  }

  private async findLeadershipRoleByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<LeadershipRoleEntity> {
    const leadershipRole = await this.prisma.leadershipRole.findFirst({
      where: {
        id,
        tenantId,
      },
      select: leadershipRoleSelect,
    });

    if (!leadershipRole) {
      throw new NotFoundException('Cargo de lideranca nao encontrado.');
    }

    return leadershipRole;
  }
}
