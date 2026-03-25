import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus, Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateMemberDto } from './dto/create-member.dto';
import { FindMembersQueryDto, MemberAgeRange } from './dto/find-members-query.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MembersListResponseDto } from './dto/members-list-response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

const TENANT_VIEW_ROLES = new Set<UserRole>(Object.values(UserRole));
const MEMBER_MANAGE_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.SECRETARIA,
]);

const memberSelect = Prisma.validator<Prisma.MemberSelect>()({
  id: true,
  fullName: true,
  birthDate: true,
  gender: true,
  phone: true,
  email: true,
  address: true,
  maritalStatus: true,
  joinedAt: true,
  baptismDate: true,
  membershipDate: true,
  conversionDate: true,
  status: true,
  notes: true,
  administrativeNotes: true,
  churchId: true,
  createdAt: true,
  updatedAt: true,
});

type MemberEntity = Prisma.MemberGetPayload<{
  select: typeof memberSelect;
}>;

type CurrentUserWithPlatformRole = AuthenticatedUser & {
  platformRole?: string | null;
};

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
    query: FindMembersQueryDto,
  ): Promise<MembersListResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit ?? query.perPage ?? query.size ?? 10;
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
        baptismDate: createMemberDto.baptismDate ?? null,
        membershipDate: createMemberDto.membershipDate ?? null,
        conversionDate: createMemberDto.conversionDate ?? null,
        status: createMemberDto.status ?? MemberStatus.ACTIVE,
        notes: createMemberDto.notes ?? null,
        administrativeNotes: createMemberDto.administrativeNotes ?? null,
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

    if ('baptismDate' in updateMemberDto) {
      data.baptismDate = updateMemberDto.baptismDate ?? null;
    }

    if ('membershipDate' in updateMemberDto) {
      data.membershipDate = updateMemberDto.membershipDate ?? null;
    }

    if ('conversionDate' in updateMemberDto) {
      data.conversionDate = updateMemberDto.conversionDate ?? null;
    }

    if (updateMemberDto.status !== undefined) {
      data.status = updateMemberDto.status;
    }

    if ('notes' in updateMemberDto) {
      data.notes = updateMemberDto.notes ?? null;
    }

    if ('administrativeNotes' in updateMemberDto) {
      data.administrativeNotes = updateMemberDto.administrativeNotes ?? null;
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
    const filters: Prisma.MemberWhereInput[] = [];

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

    const joinedRange = this.normalizeDateRange(query.joinedFrom, query.joinedTo);

    if (joinedRange.from) {
      filters.push({
        joinedAt: {
          gte: joinedRange.from,
        },
      });
    }

    if (joinedRange.to) {
      filters.push({
        joinedAt: {
          lte: joinedRange.to,
        },
      });
    }

    if (query.ageRange) {
      filters.push({
        birthDate: this.buildBirthDateFilter(query.ageRange),
      });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    return where;
  }

  private buildBirthDateFilter(
    ageRange: MemberAgeRange,
  ): Prisma.MemberWhereInput['birthDate'] {
    const today = new Date();

    switch (ageRange) {
      case MemberAgeRange.CHILDREN:
        return {
          gte: this.startOfDay(this.addDays(this.subtractYears(today, 12), 1)),
          lte: this.endOfDay(today),
        };
      case MemberAgeRange.TEENS:
        return {
          gte: this.startOfDay(this.addDays(this.subtractYears(today, 18), 1)),
          lte: this.endOfDay(this.subtractYears(today, 12)),
        };
      case MemberAgeRange.ADULTS:
        return {
          gte: this.startOfDay(this.addDays(this.subtractYears(today, 60), 1)),
          lte: this.endOfDay(this.subtractYears(today, 18)),
        };
      case MemberAgeRange.SENIORS:
        return {
          lte: this.endOfDay(this.subtractYears(today, 60)),
        };
      default:
        return {};
    }
  }

  private normalizeDateRange(
    from?: Date,
    to?: Date,
  ): { from?: Date; to?: Date } {
    if (!from && !to) {
      return {};
    }

    const normalizedFrom = from ? this.startOfDay(from) : undefined;
    const normalizedTo = to ? this.endOfDay(to) : undefined;

    if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
      return {
        from: this.startOfDay(normalizedTo),
        to: this.endOfDay(normalizedFrom),
      };
    }

    return {
      from: normalizedFrom,
      to: normalizedTo,
    };
  }

  private startOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private addDays(value: Date, days: number): Date {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
  }

  private subtractYears(value: Date, years: number): Date {
    const date = new Date(value);
    date.setFullYear(date.getFullYear() - years);
    return date;
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
      MEMBER_MANAGE_ROLES,
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

  private isPlatformUser(currentUser: AuthenticatedUser): boolean {
    return Boolean(
      (currentUser as CurrentUserWithPlatformRole).platformRole,
    );
  }
}
