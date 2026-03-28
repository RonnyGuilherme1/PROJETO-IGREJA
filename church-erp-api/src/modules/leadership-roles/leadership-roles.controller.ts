import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateLeadershipRoleDto } from './dto/create-leadership-role.dto';
import { LeadershipRoleResponseDto } from './dto/leadership-role-response.dto';
import { UpdateLeadershipRoleDto } from './dto/update-leadership-role.dto';
import { LeadershipRolesService } from './leadership-roles.service';

@Controller('leadership-roles')
@UseGuards(JwtAuthGuard)
export class LeadershipRolesController {
  constructor(
    private readonly leadershipRolesService: LeadershipRolesService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<LeadershipRoleResponseDto[]> {
    return this.leadershipRolesService.findAll(currentUser);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<LeadershipRoleResponseDto> {
    return this.leadershipRolesService.findOne(currentUser, id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createLeadershipRoleDto: CreateLeadershipRoleDto,
  ): Promise<LeadershipRoleResponseDto> {
    return this.leadershipRolesService.create(
      currentUser,
      createLeadershipRoleDto,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateLeadershipRoleDto: UpdateLeadershipRoleDto,
  ): Promise<LeadershipRoleResponseDto> {
    return this.leadershipRolesService.update(
      currentUser,
      id,
      updateLeadershipRoleDto,
    );
  }

  @Patch(':id/inactivate')
  inactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<LeadershipRoleResponseDto> {
    return this.leadershipRolesService.inactivate(currentUser, id);
  }
}
