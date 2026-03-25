import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PlatformMasterGuard } from './guards/platform-master.guard';
import { TenantsService } from './tenants.service';
import { UploadedTenantLogoFile } from './types/uploaded-tenant-logo-file.type';

@Controller('master/tenants')
@UseGuards(JwtAuthGuard, PlatformMasterGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(id);
  }

  @Post()
  create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(createTenantDto);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file?: UploadedTenantLogoFile,
  ): Promise<{ logoUrl: string }> {
    return this.tenantsService.uploadLogoByMaster(id, file);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/inactivate')
  inactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.inactivate(id);
  }

  @Patch(':id/activate')
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.activate(id);
  }
}
