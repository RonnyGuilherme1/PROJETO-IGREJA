import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateMemberDto } from './dto/create-member.dto';
import { FindMembersQueryDto } from './dto/find-members-query.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MembersListResponseDto } from './dto/members-list-response.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@Controller('tenant/members')
@UseGuards(JwtAuthGuard)
export class TenantMembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FindMembersQueryDto,
  ): Promise<MembersListResponseDto> {
    return this.membersService.findAll(currentUser, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MemberResponseDto> {
    return this.membersService.findOne(currentUser, id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createMemberDto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.membersService.create(currentUser, createMemberDto);
  }

  @Put(':id')
  updateByPut(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.membersService.update(currentUser, id, updateMemberDto);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.membersService.update(currentUser, id, updateMemberDto);
  }

  @Patch(':id/inactivate')
  inactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MemberResponseDto> {
    return this.membersService.inactivate(currentUser, id);
  }
}
