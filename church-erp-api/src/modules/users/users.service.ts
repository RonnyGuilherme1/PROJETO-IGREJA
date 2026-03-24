import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity, userSelect } from './types/user.type';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll(currentUser: AuthenticatedUser): Promise<UserResponseDto[]> {
    this.ensureAdmin(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
      },
      select: userSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => new UserResponseDto(user));
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<UserResponseDto> {
    this.ensureAdmin(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const user = await this.findUserByIdOrThrow(id, tenantId);

    return new UserResponseDto(user);
  }

  async create(
    currentUser: AuthenticatedUser,
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    this.ensureAdmin(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    await this.ensureUniqueEmail(createUserDto.email, tenantId);
    const churchId = await this.resolveChurchId(createUserDto.churchId, tenantId);

    const passwordHash = await this.authService.hashPassword(
      createUserDto.password,
    );

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        username: createUserDto.username ?? null,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role,
        status: createUserDto.status ?? UserStatus.ACTIVE,
        tenantId,
        platformRole: null,
        churchId,
      },
      select: userSelect,
    });

    return new UserResponseDto(user);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.ensureAdmin(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const existingUser = await this.findUserByIdOrThrow(id, tenantId);

    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== null &&
      updateUserDto.email.toLowerCase() !== existingUser.email?.toLowerCase()
    ) {
      await this.ensureUniqueEmail(updateUserDto.email, tenantId, id);
    }

    const data: Prisma.UserUncheckedUpdateInput = {};

    if (updateUserDto.name !== undefined) {
      data.name = updateUserDto.name;
    }

    if ('username' in updateUserDto) {
      data.username = updateUserDto.username ?? null;
    }

    if ('email' in updateUserDto) {
      data.email = updateUserDto.email ?? null;
    }

    if (updateUserDto.password !== undefined) {
      data.passwordHash = await this.authService.hashPassword(
        updateUserDto.password,
      );
    }

    if (updateUserDto.role !== undefined) {
      data.role = updateUserDto.role;
    }

    if (updateUserDto.status !== undefined) {
      data.status = updateUserDto.status;
    }

    if ('churchId' in updateUserDto) {
      data.churchId = await this.resolveChurchId(updateUserDto.churchId, tenantId);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return new UserResponseDto(user);
  }

  async inactivate(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<UserResponseDto> {
    this.ensureAdmin(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findUserByIdOrThrow(id, tenantId);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
      },
      select: userSelect,
    });

    return new UserResponseDto(user);
  }

  private ensureAdmin(currentUser: AuthenticatedUser): void {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Acesso permitido apenas para administradores.',
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

  private async findUserByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
      },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    return user;
  }

  private async ensureUniqueEmail(
    email: string,
    tenantId: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: {
          equals: email,
          mode: 'insensitive',
        },
        ...(excludeUserId
          ? {
              id: {
                not: excludeUserId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('Ja existe um usuario com este email.');
    }
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

  private async resolveChurchId(
    churchId: string | null | undefined,
    tenantId: string,
  ): Promise<string | null> {
    if (churchId) {
      await this.ensureChurchExists(churchId, tenantId);
      return churchId;
    }

    const churches = await this.prisma.church.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
      },
      take: 2,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return churches.length === 1 ? churches[0].id : null;
  }
}
