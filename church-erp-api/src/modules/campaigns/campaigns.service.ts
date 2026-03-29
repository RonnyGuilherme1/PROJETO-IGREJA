import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import {
  CampaignInstallmentStatus,
  CampaignStatus,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TENANT_LOGO_UPLOAD_ROOT } from '../tenants/constants/tenant-logo-upload.constants';
import { UploadedTenantLogoFile } from '../tenants/types/uploaded-tenant-logo-file.type';
import { AddCampaignMemberDto } from './dto/add-campaign-member.dto';
import { CampaignDetailResponseDto } from './dto/campaign-detail-response.dto';
import { CampaignInstallmentResponseDto } from './dto/campaign-installment-response.dto';
import { CampaignMemberResponseDto } from './dto/campaign-member-response.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { MarkCampaignInstallmentPaidDto } from './dto/mark-campaign-installment-paid.dto';
import { MarkCampaignInstallmentUnpaidDto } from './dto/mark-campaign-installment-unpaid.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import {
  CampaignDetailEntity,
  CampaignEntity,
  CampaignInstallmentEntity,
  campaignDetailSelect,
  campaignInstallmentSelect,
  CampaignMemberEntity,
  campaignMemberSelect,
  campaignSelect,
} from './types/campaign.type';

const CAMPAIGN_IMAGE_MAX_FILE_SIZE = 1024 * 1024;
const CAMPAIGN_IMAGE_ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const CAMPAIGN_IMAGE_ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);
const CAMPAIGN_IMAGE_UPLOAD_DIRECTORY = join(
  TENANT_LOGO_UPLOAD_ROOT,
  'campaign-images',
);
const CAMPAIGN_IMAGE_PUBLIC_BASE_PATH = '/api/uploads/campaign-images';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    currentUser: AuthenticatedUser,
  ): Promise<CampaignResponseDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        tenantId,
      },
      select: campaignSelect,
      orderBy: [{ createdAt: 'desc' }],
    });

    return campaigns.map((campaign) => new CampaignResponseDto(campaign));
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<CampaignDetailResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const campaign = await this.findCampaignDetailByIdOrThrow(id, tenantId);

    return new CampaignDetailResponseDto(campaign);
  }

  async create(
    currentUser: AuthenticatedUser,
    createCampaignDto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.ensureChurchExists(createCampaignDto.churchId, tenantId);

    const campaign = await this.prisma.campaign.create({
      data: {
        tenantId,
        churchId: createCampaignDto.churchId,
        title: createCampaignDto.title,
        description: createCampaignDto.description ?? null,
        imageUrl: this.normalizeImageUrl(createCampaignDto.imageUrl),
        installmentCount: createCampaignDto.installmentCount,
        installmentAmount: new Prisma.Decimal(
          createCampaignDto.installmentAmount,
        ),
        startDate: createCampaignDto.startDate ?? null,
        status: createCampaignDto.status ?? CampaignStatus.ACTIVE,
      },
      select: campaignSelect,
    });

    return new CampaignResponseDto(campaign);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingCampaign = await this.findCampaignByIdOrThrow(id, tenantId);

    if (updateCampaignDto.churchId !== undefined) {
      await this.ensureChurchExists(updateCampaignDto.churchId, tenantId);
    }

    this.ensureCampaignCanBeUpdated(existingCampaign, updateCampaignDto);

    const data: Prisma.CampaignUncheckedUpdateInput = {};

    if (updateCampaignDto.churchId !== undefined) {
      data.churchId = updateCampaignDto.churchId;
    }

    if (updateCampaignDto.title !== undefined) {
      data.title = updateCampaignDto.title;
    }

    if ('description' in updateCampaignDto) {
      data.description = updateCampaignDto.description ?? null;
    }

    if ('imageUrl' in updateCampaignDto) {
      data.imageUrl = this.normalizeImageUrl(updateCampaignDto.imageUrl);
    }

    if (updateCampaignDto.installmentCount !== undefined) {
      data.installmentCount = updateCampaignDto.installmentCount;
    }

    if (updateCampaignDto.installmentAmount !== undefined) {
      data.installmentAmount = new Prisma.Decimal(
        updateCampaignDto.installmentAmount,
      );
    }

    if ('startDate' in updateCampaignDto) {
      data.startDate = updateCampaignDto.startDate ?? null;
    }

    if (updateCampaignDto.status !== undefined) {
      data.status = updateCampaignDto.status;
    }

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data,
      select: campaignSelect,
    });

    await this.deleteManagedImageIfReplaced(
      existingCampaign.imageUrl,
      campaign.imageUrl,
    );

    return new CampaignResponseDto(campaign);
  }

  async uploadImage(
    currentUser: AuthenticatedUser,
    id: string,
    file?: UploadedTenantLogoFile,
  ): Promise<{ imageUrl: string }> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingCampaign = await this.findCampaignByIdOrThrow(id, tenantId);
    const validatedFile = this.validateCampaignImageFile(file);
    const filename = await this.saveCampaignImageFile(id, validatedFile);
    const nextImageUrl = `${CAMPAIGN_IMAGE_PUBLIC_BASE_PATH}/${filename}`;

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        imageUrl: nextImageUrl,
      },
      select: {
        imageUrl: true,
      },
    });

    await this.deleteManagedImageIfReplaced(
      existingCampaign.imageUrl,
      campaign.imageUrl,
    );

    return {
      imageUrl: campaign.imageUrl ?? nextImageUrl,
    };
  }

  async addMember(
    currentUser: AuthenticatedUser,
    campaignId: string,
    addCampaignMemberDto: AddCampaignMemberDto,
  ): Promise<CampaignMemberResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const campaign = await this.findCampaignByIdOrThrow(campaignId, tenantId);
    const member = await this.findMemberForCampaignByIdOrThrow(
      addCampaignMemberDto.memberId,
      tenantId,
    );

    if (campaign.status === CampaignStatus.CLOSED) {
      throw new BadRequestException(
        'Nao e possivel adicionar membros a uma campanha encerrada.',
      );
    }

    if (member.churchId !== campaign.churchId) {
      throw new BadRequestException(
        'O membro precisa pertencer a mesma igreja da campanha.',
      );
    }

    await this.ensureMemberIsNotAlreadyLinked(campaignId, addCampaignMemberDto.memberId);

    const campaignMember = await this.prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        memberId: member.id,
        joinedAt: addCampaignMemberDto.joinedAt ?? new Date(),
        notes: addCampaignMemberDto.notes ?? null,
        installments: {
          create: this.buildInstallmentsForCampaign(campaign),
        },
      },
      select: campaignMemberSelect,
    });

    return new CampaignMemberResponseDto(campaignMember);
  }

  async markInstallmentPaid(
    currentUser: AuthenticatedUser,
    id: string,
    markInstallmentPaidDto: MarkCampaignInstallmentPaidDto,
  ): Promise<CampaignInstallmentResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findCampaignInstallmentByIdOrThrow(id, tenantId);

    const data: Prisma.CampaignInstallmentUpdateInput = {
      status: CampaignInstallmentStatus.PAID,
      paidAt: markInstallmentPaidDto.paidAt ?? new Date(),
    };

    if ('notes' in markInstallmentPaidDto) {
      data.notes = markInstallmentPaidDto.notes ?? null;
    }

    const installment = await this.prisma.campaignInstallment.update({
      where: { id },
      data,
      select: campaignInstallmentSelect,
    });

    return new CampaignInstallmentResponseDto(installment);
  }

  async markInstallmentUnpaid(
    currentUser: AuthenticatedUser,
    id: string,
    markInstallmentUnpaidDto: MarkCampaignInstallmentUnpaidDto,
  ): Promise<CampaignInstallmentResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findCampaignInstallmentByIdOrThrow(id, tenantId);

    const data: Prisma.CampaignInstallmentUpdateInput = {
      status: CampaignInstallmentStatus.UNPAID,
      paidAt: null,
    };

    if ('notes' in markInstallmentUnpaidDto) {
      data.notes = markInstallmentUnpaidDto.notes ?? null;
    }

    const installment = await this.prisma.campaignInstallment.update({
      where: { id },
      data,
      select: campaignInstallmentSelect,
    });

    return new CampaignInstallmentResponseDto(installment);
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }
  }

  private ensureCanManage(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SECRETARIA
    ) {
      throw new ForbiddenException(
        'Acesso permitido apenas para administradores e secretaria.',
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

  private async ensureMemberIsNotAlreadyLinked(
    campaignId: string,
    memberId: string,
  ): Promise<void> {
    const existingLink = await this.prisma.campaignMember.findFirst({
      where: {
        campaignId,
        memberId,
      },
      select: {
        id: true,
      },
    });

    if (existingLink) {
      throw new ConflictException('Este membro ja foi vinculado a campanha.');
    }
  }

  private ensureCampaignCanBeUpdated(
    existingCampaign: CampaignEntity,
    updateCampaignDto: UpdateCampaignDto,
  ): void {
    if (existingCampaign._count.members === 0) {
      return;
    }

    const attemptedToChangeChurch =
      updateCampaignDto.churchId !== undefined &&
      updateCampaignDto.churchId !== existingCampaign.churchId;
    const attemptedToChangeInstallmentCount =
      updateCampaignDto.installmentCount !== undefined &&
      updateCampaignDto.installmentCount !== existingCampaign.installmentCount;
    const attemptedToChangeInstallmentAmount =
      updateCampaignDto.installmentAmount !== undefined &&
      new Prisma.Decimal(updateCampaignDto.installmentAmount).toString() !==
        existingCampaign.installmentAmount.toString();
    const attemptedToChangeStartDate =
      'startDate' in updateCampaignDto &&
      !this.areDatesEqual(
        existingCampaign.startDate,
        updateCampaignDto.startDate ?? null,
      );

    if (
      attemptedToChangeChurch ||
      attemptedToChangeInstallmentCount ||
      attemptedToChangeInstallmentAmount ||
      attemptedToChangeStartDate
    ) {
      throw new BadRequestException(
        'Nao e possivel alterar igreja, parcelas, valor da parcela ou data inicial apos vincular membros.',
      );
    }
  }

  private buildInstallmentsForCampaign(
    campaign: CampaignEntity,
  ): Prisma.CampaignInstallmentCreateWithoutCampaignMemberInput[] {
    return Array.from({ length: campaign.installmentCount }, (_, index) => ({
      installmentNumber: index + 1,
      amount: campaign.installmentAmount,
      dueDate: campaign.startDate
        ? this.addMonthsToDate(campaign.startDate, index)
        : null,
      status: CampaignInstallmentStatus.UNPAID,
      paidAt: null,
      notes: null,
    }));
  }

  private addMonthsToDate(date: Date, months: number): Date {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + months);

    return nextDate;
  }

  private areDatesEqual(
    firstDate: Date | null,
    secondDate: Date | null,
  ): boolean {
    if (!firstDate && !secondDate) {
      return true;
    }

    if (!firstDate || !secondDate) {
      return false;
    }

    return firstDate.getTime() === secondDate.getTime();
  }

  private async findCampaignByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<CampaignEntity> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        tenantId,
      },
      select: campaignSelect,
    });

    if (!campaign) {
      throw new NotFoundException('Campanha nao encontrada.');
    }

    return campaign;
  }

  private async findCampaignDetailByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<CampaignDetailEntity> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        tenantId,
      },
      select: campaignDetailSelect,
    });

    if (!campaign) {
      throw new NotFoundException('Campanha nao encontrada.');
    }

    return campaign;
  }

  private async findMemberForCampaignByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<{ id: string; churchId: string }> {
    const member = await this.prisma.member.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        churchId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Membro nao encontrado.');
    }

    return member;
  }

  private async findCampaignInstallmentByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<CampaignInstallmentEntity> {
    const installment = await this.prisma.campaignInstallment.findFirst({
      where: {
        id,
        campaignMember: {
          campaign: {
            tenantId,
          },
        },
      },
      select: campaignInstallmentSelect,
    });

    if (!installment) {
      throw new NotFoundException('Parcela da campanha nao encontrada.');
    }

    return installment;
  }

  private normalizeImageUrl(imageUrl?: string | null): string | null {
    if (typeof imageUrl !== 'string') {
      return null;
    }

    const trimmedImageUrl = imageUrl.trim();

    return trimmedImageUrl.length > 0 ? trimmedImageUrl : null;
  }

  private validateCampaignImageFile(
    file?: UploadedTenantLogoFile,
  ): UploadedTenantLogoFile {
    if (!file) {
      throw new BadRequestException('Envie o arquivo da imagem da campanha.');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'O arquivo enviado para a imagem da campanha esta vazio.',
      );
    }

    if (file.size > CAMPAIGN_IMAGE_MAX_FILE_SIZE) {
      throw new BadRequestException(
        'A imagem da campanha deve ter no maximo 1 MB.',
      );
    }

    const normalizedMimeType = String(file.mimetype ?? '').trim().toLowerCase();
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    const hasAllowedMimeType =
      normalizedMimeType.length > 0 &&
      CAMPAIGN_IMAGE_ALLOWED_MIME_TYPES.has(normalizedMimeType);
    const hasAllowedExtension =
      normalizedExtension.length > 0 &&
      CAMPAIGN_IMAGE_ALLOWED_EXTENSIONS.has(normalizedExtension);

    if (
      (normalizedMimeType && !hasAllowedMimeType) ||
      (normalizedExtension && !hasAllowedExtension) ||
      (!normalizedMimeType && !hasAllowedExtension)
    ) {
      throw new BadRequestException(
        'A imagem da campanha deve ser PNG, JPG, JPEG ou WEBP.',
      );
    }

    return file;
  }

  private async saveCampaignImageFile(
    campaignId: string,
    file: UploadedTenantLogoFile,
  ): Promise<string> {
    const extension = this.resolveCampaignImageExtension(file);
    const safeCampaignId = campaignId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const filename = `${safeCampaignId}-${Date.now()}-${randomUUID()}.${extension}`;
    const destination = join(CAMPAIGN_IMAGE_UPLOAD_DIRECTORY, filename);

    await mkdir(CAMPAIGN_IMAGE_UPLOAD_DIRECTORY, { recursive: true });
    await writeFile(destination, file.buffer);

    return filename;
  }

  private resolveCampaignImageExtension(file: UploadedTenantLogoFile): string {
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    if (CAMPAIGN_IMAGE_ALLOWED_EXTENSIONS.has(normalizedExtension)) {
      return normalizedExtension.slice(1);
    }

    switch (String(file.mimetype ?? '').trim().toLowerCase()) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/jpeg':
        return 'jpg';
      default:
        throw new BadRequestException(
          'Nao foi possivel determinar a extensao da imagem enviada.',
        );
    }
  }

  private async deleteManagedImageIfReplaced(
    previousImageUrl?: string | null,
    nextImageUrl?: string | null,
  ): Promise<void> {
    const previousFilePath = this.resolveManagedImageFilePath(previousImageUrl);
    const normalizedPreviousImageUrl = this.normalizeImageUrl(previousImageUrl);
    const normalizedNextImageUrl = this.normalizeImageUrl(nextImageUrl);

    if (
      !previousFilePath ||
      normalizedPreviousImageUrl === normalizedNextImageUrl
    ) {
      return;
    }

    try {
      await unlink(previousFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveManagedImageFilePath(
    imageUrl?: string | null,
  ): string | null {
    const normalizedImageUrl = this.normalizeImageUrl(imageUrl);

    if (
      !normalizedImageUrl ||
      !normalizedImageUrl.startsWith(`${CAMPAIGN_IMAGE_PUBLIC_BASE_PATH}/`)
    ) {
      return null;
    }

    const filename = normalizedImageUrl.slice(
      CAMPAIGN_IMAGE_PUBLIC_BASE_PATH.length + 1,
    );

    if (!filename || filename !== basename(filename)) {
      return null;
    }

    return join(CAMPAIGN_IMAGE_UPLOAD_DIRECTORY, filename);
  }
}
