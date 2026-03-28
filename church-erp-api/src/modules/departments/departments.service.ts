import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentEntity, departmentSelect } from './types/department.type';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
  ): Promise<DepartmentResponseDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const departments = await this.prisma.department.findMany({
      where: {
        tenantId,
      },
      select: departmentSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    return departments.map((department) => new DepartmentResponseDto(department));
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<DepartmentResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const department = await this.findDepartmentByIdOrThrow(id, tenantId);

    return new DepartmentResponseDto(department);
  }

  async create(
    currentUser: AuthenticatedUser,
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.ensureUniqueName(createDepartmentDto.name, tenantId);

    const department = await this.prisma.department.create({
      data: {
        tenantId,
        name: createDepartmentDto.name,
        description: createDepartmentDto.description ?? null,
        active: createDepartmentDto.active ?? true,
      },
      select: departmentSelect,
    });

    return new DepartmentResponseDto(department);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findDepartmentByIdOrThrow(id, tenantId);

    if (updateDepartmentDto.name !== undefined) {
      await this.ensureUniqueName(updateDepartmentDto.name, tenantId, id);
    }

    const data: Prisma.DepartmentUpdateInput = {};

    if (updateDepartmentDto.name !== undefined) {
      data.name = updateDepartmentDto.name;
    }

    if ('description' in updateDepartmentDto) {
      data.description = updateDepartmentDto.description ?? null;
    }

    if (updateDepartmentDto.active !== undefined) {
      data.active = updateDepartmentDto.active;
    }

    const department = await this.prisma.department.update({
      where: { id },
      data,
      select: departmentSelect,
    });

    return new DepartmentResponseDto(department);
  }

  async inactivate(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<DepartmentResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findDepartmentByIdOrThrow(id, tenantId);

    const department = await this.prisma.department.update({
      where: { id },
      data: {
        active: false,
      },
      select: departmentSelect,
    });

    return new DepartmentResponseDto(department);
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
    const existingDepartment = await this.prisma.department.findFirst({
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

    if (existingDepartment) {
      throw new ConflictException('Ja existe um departamento com este nome.');
    }
  }

  private async findDepartmentByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<DepartmentEntity> {
    const department = await this.prisma.department.findFirst({
      where: {
        id,
        tenantId,
      },
      select: departmentSelect,
    });

    if (!department) {
      throw new NotFoundException('Departamento nao encontrado.');
    }

    return department;
  }
}
