import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PlatformRole,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PlatformUserResponseDto } from './dto/platform-user-response.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  PlatformUserEntity,
  platformUserSelect,
} from './types/platform-user.type';
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

  async findAllPlatformUsers(
    currentUser: AuthenticatedUser,
  ): Promise<PlatformUserResponseDto[]> {
    this.ensurePlatformUserManagementAccess(currentUser);

    const users = await this.prisma.user.findMany({
      where: {
        tenantId: null,
        platformRole: {
          not: null,
        },
      },
      select: platformUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => new PlatformUserResponseDto(user));
  }

  async findOnePlatformUser(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<PlatformUserResponseDto> {
    this.ensurePlatformUserManagementAccess(currentUser);

    const user = await this.findPlatformUserByIdOrThrow(id);

    return new PlatformUserResponseDto(user);
  }

  async createPlatformUser(
    currentUser: AuthenticatedUser,
    createPlatformUserDto: CreatePlatformUserDto,
  ): Promise<PlatformUserResponseDto> {
    this.ensurePlatformUserManagementAccess(currentUser);
    this.ensurePlatformRoleCanBeManaged(createPlatformUserDto.platformRole);
    await this.ensureUniquePlatformUsername(createPlatformUserDto.username);
    await this.ensureUniquePlatformEmail(createPlatformUserDto.email);

    const passwordHash = await this.authService.hashPassword(
      createPlatformUserDto.password,
    );

    const user = await this.prisma.user.create({
      data: {
        name: createPlatformUserDto.name,
        username: createPlatformUserDto.username,
        email: createPlatformUserDto.email ?? null,
        passwordHash,
        role: UserRole.ADMIN,
        status: createPlatformUserDto.status ?? UserStatus.ACTIVE,
        tenantId: null,
        platformRole: createPlatformUserDto.platformRole,
        isSystemProtected: false,
        createdByPlatformUserId: currentUser.id,
        churchId: null,
      },
      select: platformUserSelect,
    });

    return new PlatformUserResponseDto(user);
  }

  async updatePlatformUser(
    currentUser: AuthenticatedUser,
    id: string,
    updatePlatformUserDto: UpdatePlatformUserDto,
  ): Promise<PlatformUserResponseDto> {
    this.ensurePlatformUserManagementAccess(currentUser);
    const existingUser = await this.findPlatformUserByIdOrThrow(id);

    if (
      updatePlatformUserDto.username !== undefined &&
      updatePlatformUserDto.username.toLowerCase() !==
        (existingUser.username ?? '').toLowerCase()
    ) {
      await this.ensureUniquePlatformUsername(updatePlatformUserDto.username, id);
    }

    if (
      'email' in updatePlatformUserDto &&
      (updatePlatformUserDto.email ?? null)?.toLowerCase() !==
        existingUser.email?.toLowerCase()
    ) {
      await this.ensureUniquePlatformEmail(updatePlatformUserDto.email, id);
    }

    this.ensurePlatformUserCanBeUpdated(existingUser, updatePlatformUserDto);

    const data: Prisma.UserUncheckedUpdateInput = {};

    if (updatePlatformUserDto.name !== undefined) {
      data.name = updatePlatformUserDto.name;
    }

    if (updatePlatformUserDto.username !== undefined) {
      data.username = updatePlatformUserDto.username;
    }

    if ('email' in updatePlatformUserDto) {
      data.email = updatePlatformUserDto.email ?? null;
    }

    if (updatePlatformUserDto.password !== undefined) {
      data.passwordHash = await this.authService.hashPassword(
        updatePlatformUserDto.password,
      );
    }

    if (updatePlatformUserDto.platformRole !== undefined) {
      data.platformRole = updatePlatformUserDto.platformRole;
    }

    if (updatePlatformUserDto.status !== undefined) {
      data.status = updatePlatformUserDto.status;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: platformUserSelect,
    });

    return new PlatformUserResponseDto(user);
  }

  async inactivatePlatformUser(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<PlatformUserResponseDto> {
    this.ensurePlatformUserManagementAccess(currentUser);
    const existingUser = await this.findPlatformUserByIdOrThrow(id);

    if (existingUser.isSystemProtected) {
      throw new ForbiddenException(
        'Usuario protegido do sistema nao pode ser inativado.',
      );
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.INACTIVE,
      },
      select: platformUserSelect,
    });

    return new PlatformUserResponseDto(user);
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

  private ensurePlatformUserManagementAccess(
    currentUser: AuthenticatedUser,
  ): void {
    if (
      currentUser.tenantId !== null ||
      currentUser.platformRole !== PlatformRole.PLATFORM_ADMIN
    ) {
      throw new ForbiddenException(
        'Apenas administradores da plataforma podem gerenciar usuarios master.',
      );
    }
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

  private async findPlatformUserByIdOrThrow(
    id: string,
  ): Promise<PlatformUserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId: null,
        platformRole: {
          not: null,
        },
      },
      select: platformUserSelect,
    });

    if (!user || !user.platformRole) {
      throw new NotFoundException('Usuario da plataforma nao encontrado.');
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

  private async ensureUniquePlatformUsername(
    username: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
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
      throw new ConflictException('Ja existe um usuario com este username.');
    }
  }

  private async ensureUniquePlatformEmail(
    email?: string | null,
    excludeUserId?: string,
  ): Promise<void> {
    if (!email) {
      return;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
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

  private ensurePlatformRoleCanBeManaged(
    nextRole: PlatformRole,
    currentRole?: PlatformRole | null,
  ): void {
    if (
      nextRole === PlatformRole.PLATFORM_SUPPORT &&
      currentRole !== PlatformRole.PLATFORM_SUPPORT
    ) {
      throw new ForbiddenException(
        'O perfil de suporte nao pode ser criado por este fluxo.',
      );
    }
  }

  private ensurePlatformUserCanBeUpdated(
    existingUser: PlatformUserEntity,
    updatePlatformUserDto: UpdatePlatformUserDto,
  ): void {
    if (updatePlatformUserDto.platformRole !== undefined) {
      this.ensurePlatformRoleCanBeManaged(
        updatePlatformUserDto.platformRole,
        existingUser.platformRole,
      );
    }

    if (!existingUser.isSystemProtected) {
      return;
    }

    if (updatePlatformUserDto.status === UserStatus.INACTIVE) {
      throw new ForbiddenException(
        'Usuario protegido do sistema nao pode ser inativado.',
      );
    }

    if (
      updatePlatformUserDto.platformRole !== undefined &&
      updatePlatformUserDto.platformRole !== PlatformRole.PLATFORM_ADMIN
    ) {
      throw new ForbiddenException(
        'Usuario protegido do sistema nao pode perder privilegios de administrador.',
      );
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
