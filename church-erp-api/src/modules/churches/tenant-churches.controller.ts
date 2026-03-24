import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ChurchesService } from './churches.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { ChurchResponseDto } from './dto/church-response.dto';
import { UpdateChurchDto } from './dto/update-church.dto';

@Controller('tenant/churches')
@UseGuards(JwtAuthGuard)
export class TenantChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ChurchResponseDto[]> {
    return this.churchesService.findAll(currentUser);
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

  @Put(':id')
  updateByPut(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChurchDto: UpdateChurchDto,
  ): Promise<ChurchResponseDto> {
    return this.churchesService.update(currentUser, id, updateChurchDto);
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
