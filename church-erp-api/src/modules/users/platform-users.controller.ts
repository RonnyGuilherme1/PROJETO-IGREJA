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
import { PlatformMasterGuard } from '../tenants/guards/platform-master.guard';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { PlatformUserResponseDto } from './dto/platform-user-response.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { UsersService } from './users.service';

@Controller('master/users')
@UseGuards(JwtAuthGuard, PlatformMasterGuard)
export class PlatformUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PlatformUserResponseDto[]> {
    return this.usersService.findAllPlatformUsers(currentUser);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PlatformUserResponseDto> {
    return this.usersService.findOnePlatformUser(currentUser, id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createPlatformUserDto: CreatePlatformUserDto,
  ): Promise<PlatformUserResponseDto> {
    return this.usersService.createPlatformUser(
      currentUser,
      createPlatformUserDto,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePlatformUserDto: UpdatePlatformUserDto,
  ): Promise<PlatformUserResponseDto> {
    return this.usersService.updatePlatformUser(
      currentUser,
      id,
      updatePlatformUserDto,
    );
  }

  @Patch(':id/inactivate')
  inactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PlatformUserResponseDto> {
    return this.usersService.inactivatePlatformUser(currentUser, id);
  }
}
