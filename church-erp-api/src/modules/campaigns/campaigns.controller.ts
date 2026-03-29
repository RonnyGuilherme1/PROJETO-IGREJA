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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UploadedTenantLogoFile } from '../tenants/types/uploaded-tenant-logo-file.type';
import { CampaignsService } from './campaigns.service';
import { AddCampaignMemberDto } from './dto/add-campaign-member.dto';
import { CampaignDetailResponseDto } from './dto/campaign-detail-response.dto';
import { CampaignInstallmentResponseDto } from './dto/campaign-installment-response.dto';
import { CampaignMemberResponseDto } from './dto/campaign-member-response.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { MarkCampaignInstallmentPaidDto } from './dto/mark-campaign-installment-paid.dto';
import { MarkCampaignInstallmentUnpaidDto } from './dto/mark-campaign-installment-unpaid.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<CampaignResponseDto[]> {
    return this.campaignsService.findAll(currentUser);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CampaignDetailResponseDto> {
    return this.campaignsService.findOne(currentUser, id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createCampaignDto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.create(currentUser, createCampaignDto);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    return this.campaignsService.update(currentUser, id, updateCampaignDto);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file?: UploadedTenantLogoFile,
  ): Promise<{ imageUrl: string }> {
    return this.campaignsService.uploadImage(currentUser, id, file);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() addCampaignMemberDto: AddCampaignMemberDto,
  ): Promise<CampaignMemberResponseDto> {
    return this.campaignsService.addMember(currentUser, id, addCampaignMemberDto);
  }

  @Patch('installments/:id/pay')
  markInstallmentPaid(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() markInstallmentPaidDto: MarkCampaignInstallmentPaidDto,
  ): Promise<CampaignInstallmentResponseDto> {
    return this.campaignsService.markInstallmentPaid(
      currentUser,
      id,
      markInstallmentPaidDto,
    );
  }

  @Patch('installments/:id/unpay')
  markInstallmentUnpaid(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() markInstallmentUnpaidDto: MarkCampaignInstallmentUnpaidDto,
  ): Promise<CampaignInstallmentResponseDto> {
    return this.campaignsService.markInstallmentUnpaid(
      currentUser,
      id,
      markInstallmentUnpaidDto,
    );
  }
}
