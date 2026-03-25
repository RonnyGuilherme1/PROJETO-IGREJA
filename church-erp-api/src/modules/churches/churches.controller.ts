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
import { ChurchesService } from './churches.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { ChurchResponseDto } from './dto/church-response.dto';
import { UpdateChurchDto } from './dto/update-church.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 5000;

type QueryParamValue = string | string[] | undefined;

interface FindChurchesQueryParams {
  page?: QueryParamValue;
  limit?: QueryParamValue;
  name?: QueryParamValue;
  status?: QueryParamValue;
}

interface ChurchesListResponseDto {
  items: ChurchResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Controller('churches')
@UseGuards(JwtAuthGuard)
export class ChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FindChurchesQueryParams,
  ): Promise<ChurchesListResponseDto> {
    const churches = await this.churchesService.findAll(currentUser);
    const filteredChurches = churches.filter((church) =>
      matchesChurchFilters(church, query),
    );
    const page = parsePage(query.page);
    const limit = parseLimit(query.limit);
    const total = filteredChurches.length;
    const start = (page - 1) * limit;

    return {
      items: filteredChurches.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ChurchResponseDto> {
    return this.churchesService.findOne(currentUser, id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createChurchDto: CreateChurchDto,
  ): Promise<ChurchResponseDto> {
    return this.churchesService.create(currentUser, createChurchDto);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChurchDto: UpdateChurchDto,
  ): Promise<ChurchResponseDto> {
    return this.churchesService.update(currentUser, id, updateChurchDto);
  }

  @Patch(':id/inactivate')
  inactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ChurchResponseDto> {
    return this.churchesService.inactivate(currentUser, id);
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

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR');
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

function matchesChurchFilters(
  church: ChurchResponseDto,
  query: FindChurchesQueryParams,
): boolean {
  const name = getQueryValue(query.name);
  const status = getQueryValue(query.status)?.toUpperCase();

  return (
    (!name || normalizeSearchValue(church.name).includes(normalizeSearchValue(name))) &&
    (!status || church.status === status)
  );
}
