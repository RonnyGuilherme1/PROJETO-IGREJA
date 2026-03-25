import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 5000;

type QueryParamValue = string | string[] | undefined;

interface FindUsersQueryParams {
  page?: QueryParamValue;
  limit?: QueryParamValue;
  name?: QueryParamValue;
  email?: QueryParamValue;
  status?: QueryParamValue;
  role?: QueryParamValue;
}

interface UsersListResponseDto {
  items: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FindUsersQueryParams,
  ): Promise<UsersListResponseDto> {
    return this.usersService.findAll(currentUser, {
      page: parsePage(query.page),
      limit: parseLimit(query.limit),
      name: getQueryValue(query.name),
      email: getQueryValue(query.email),
      status: normalizeEnumValue(query.status),
      role: normalizeEnumValue(query.role),
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(currentUser, id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(currentUser, createUserDto);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(currentUser, id, updateUserDto);
  }

  @Patch(':id/inactivate')
  inactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.inactivate(currentUser, id);
  }
}

function getQueryValue(value: QueryParamValue): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== 'string') {
    return undefined;
  }

  const normalizedValue = rawValue.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeEnumValue(value: QueryParamValue): string | undefined {
  return getQueryValue(value)?.toUpperCase();
}

function parsePage(value: QueryParamValue): number {
  const parsedValue = Number(getQueryValue(value));

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return DEFAULT_PAGE;
  }

  return parsedValue;
}

function parseLimit(value: QueryParamValue): number {
  const parsedValue = Number(getQueryValue(value));

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsedValue, MAX_LIMIT);
}
