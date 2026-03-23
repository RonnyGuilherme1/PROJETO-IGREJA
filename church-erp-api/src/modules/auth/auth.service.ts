import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantStatus, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { MasterLoginDto } from './dto/master-login.dto';
import { AuthAccessType } from './enums/auth-access-type.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import {
  authenticatedUserSelect,
  AuthenticatedUser,
  UserWithCredentials,
  userWithCredentialsSelect,
} from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const tenant = await this.findTenantByCode(loginDto.tenantCode);
    const user = await this.findTenantUserByUsername(
      tenant.id,
      loginDto.username,
    );

    this.ensureUserCanAuthenticate(user);
    this.ensureTenantIsActive(tenant.status);
    await this.validatePassword(loginDto.password, user.passwordHash);
    const authenticatedUser = this.toAuthenticatedUser(user);

    return new LoginResponseDto({
      accessToken: await this.generateAccessToken(authenticatedUser),
      user: new AuthUserDto(authenticatedUser),
    });
  }

  async masterLogin(
    masterLoginDto: MasterLoginDto,
  ): Promise<LoginResponseDto> {
    const user = await this.findPlatformUserByUsername(masterLoginDto.username);

    this.ensureUserCanAuthenticate(user);
    await this.validatePassword(masterLoginDto.password, user.passwordHash);
    const authenticatedUser = this.toAuthenticatedUser(user);

    return new LoginResponseDto({
      accessToken: await this.generateAccessToken(authenticatedUser),
      user: new AuthUserDto(authenticatedUser),
    });
  }

  async getProfile(user: AuthenticatedUser): Promise<AuthUserDto> {
    return new AuthUserDto(user);
  }

  async validateJwtPayload(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: authenticatedUserSelect,
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Acesso nao autorizado.');
    }

    if (user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          status: true,
        },
      });

      if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
        throw new UnauthorizedException('Acesso nao autorizado.');
      }
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async findTenantByCode(tenantCode: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug: tenantCode,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return tenant;
  }

  private async findTenantUserByUsername(
    tenantId: string,
    username: string,
  ): Promise<UserWithCredentials> {
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: userWithCredentialsSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return user;
  }

  private async findPlatformUserByUsername(
    username: string,
  ): Promise<UserWithCredentials> {
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: null,
        platformRole: {
          not: null,
        },
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: userWithCredentialsSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return user;
  }

  private ensureUserCanAuthenticate(user: UserWithCredentials): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inativo.');
    }
  }

  private ensureTenantIsActive(status: TenantStatus): void {
    if (status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException('Tenant inativo.');
    }
  }

  private async validatePassword(
    password: string,
    passwordHash: string,
  ): Promise<void> {
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }
  }

  private toAuthenticatedUser(user: UserWithCredentials): AuthenticatedUser {
    const { passwordHash, ...authenticatedUser } = user;

    return authenticatedUser;
  }

  private generateAccessToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      platformRole: user.platformRole,
      accessType: this.resolveAccessType(user),
      churchId: user.churchId,
    };

    return this.jwtService.signAsync(payload);
  }

  private resolveAccessType(user: AuthenticatedUser): AuthAccessType {
    return user.platformRole ? AuthAccessType.PLATFORM : AuthAccessType.TENANT;
  }
}
