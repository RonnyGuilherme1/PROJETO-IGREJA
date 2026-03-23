import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateMemberDto } from './dto/create-member.dto';
import { FindMembersQueryDto } from './dto/find-members-query.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MembersListResponseDto } from './dto/members-list-response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberEntity, memberSelect } from './types/member.type';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
    query: FindMembersQueryDto,
  ): Promise<MembersListResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query, tenantId);

    const [members, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        select: memberSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return new MembersListResponseDto({
      items: members.map((member) => new MemberResponseDto(member)),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    });
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<MemberResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const member = await this.findMemberByIdOrThrow(id, tenantId);

    return new MemberResponseDto(member);
  }

  async create(
    currentUser: AuthenticatedUser,
    createMemberDto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.ensureChurchExists(createMemberDto.churchId, tenantId);

    const member = await this.prisma.member.create({
      data: {
        tenantId,
        fullName: createMemberDto.fullName,
        birthDate: createMemberDto.birthDate ?? null,
        gender: createMemberDto.gender ?? null,
        phone: createMemberDto.phone ?? null,
        email: createMemberDto.email ?? null,
        address: createMemberDto.address ?? null,
        maritalStatus: createMemberDto.maritalStatus ?? null,
        joinedAt: createMemberDto.joinedAt ?? null,
        status: createMemberDto.status ?? MemberStatus.ACTIVE,
        notes: createMemberDto.notes ?? null,
        churchId: createMemberDto.churchId,
      },
      select: memberSelect,
    });

    return new MemberResponseDto(member);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateMemberDto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findMemberByIdOrThrow(id, tenantId);

    if (updateMemberDto.churchId !== undefined) {
      await this.ensureChurchExists(updateMemberDto.churchId, tenantId);
    }

    const data: Prisma.MemberUncheckedUpdateInput = {};

    if (updateMemberDto.fullName !== undefined) {
      data.fullName = updateMemberDto.fullName;
    }

    if ('birthDate' in updateMemberDto) {
      data.birthDate = updateMemberDto.birthDate ?? null;
    }

    if ('gender' in updateMemberDto) {
      data.gender = updateMemberDto.gender ?? null;
    }

    if ('phone' in updateMemberDto) {
      data.phone = updateMemberDto.phone ?? null;
    }

    if ('email' in updateMemberDto) {
      data.email = updateMemberDto.email ?? null;
    }

    if ('address' in updateMemberDto) {
      data.address = updateMemberDto.address ?? null;
    }

    if ('maritalStatus' in updateMemberDto) {
      data.maritalStatus = updateMemberDto.maritalStatus ?? null;
    }

    if ('joinedAt' in updateMemberDto) {
      data.joinedAt = updateMemberDto.joinedAt ?? null;
    }

    if (updateMemberDto.status !== undefined) {
      data.status = updateMemberDto.status;
    }

    if ('notes' in updateMemberDto) {
      data.notes = updateMemberDto.notes ?? null;
    }

    if (updateMemberDto.churchId !== undefined) {
      data.churchId = updateMemberDto.churchId;
    }

    const member = await this.prisma.member.update({
      where: { id },
      data,
      select: memberSelect,
    });

    return new MemberResponseDto(member);
  }

  async inactivate(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<MemberResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findMemberByIdOrThrow(id, tenantId);

    const member = await this.prisma.member.update({
      where: { id },
      data: {
        status: MemberStatus.INACTIVE,
      },
      select: memberSelect,
    });

    return new MemberResponseDto(member);
  }

  private buildWhere(
    query: FindMembersQueryDto,
    tenantId: string,
  ): Prisma.MemberWhereInput {
    const where: Prisma.MemberWhereInput = {
      tenantId,
    };

    if (query.name) {
      where.fullName = {
        contains: query.name,
        mode: 'insensitive',
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.churchId) {
      where.churchId = query.churchId;
    }

    return where;
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

  private async ensureChurchExists(
    churchId: string,
    tenantId: string,
  ): Promise<void> {
    const church = await this.prisma.church.findFirst({
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

  private async findMemberByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<MemberEntity> {
    const member = await this.prisma.member.findFirst({
      where: {
        id,
        tenantId,
      },
      select: memberSelect,
    });

    if (!member) {
      throw new NotFoundException('Membro nao encontrado.');
    }

    return member;
  }
}
