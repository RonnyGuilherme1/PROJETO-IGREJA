import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TENANT_LOGO_UPLOAD_ROOT } from '../tenants/constants/tenant-logo-upload.constants';
import { UploadedTenantLogoFile } from '../tenants/types/uploaded-tenant-logo-file.type';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { NoticeEntity, noticeSelect } from './types/notice.type';

const NOTICE_IMAGE_MAX_FILE_SIZE = 1024 * 1024;
const NOTICE_IMAGE_ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const NOTICE_IMAGE_ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);
const NOTICE_IMAGE_UPLOAD_DIRECTORY = join(
  TENANT_LOGO_UPLOAD_ROOT,
  'notice-images',
);
const NOTICE_IMAGE_PUBLIC_BASE_PATH = '/api/uploads/notice-images';

@Injectable()
export class NoticesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: AuthenticatedUser): Promise<NoticeResponseDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const notices = await this.prisma.notice.findMany({
      where: {
        tenantId,
      },
      select: noticeSelect,
      orderBy: [{ createdAt: 'desc' }],
    });

    return notices.map((notice) => new NoticeResponseDto(notice));
  }

  async findOne(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<NoticeResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const notice = await this.findNoticeByIdOrThrow(id, tenantId);

    return new NoticeResponseDto(notice);
  }

  async create(
    currentUser: AuthenticatedUser,
    createNoticeDto: CreateNoticeDto,
  ): Promise<NoticeResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    if (createNoticeDto.churchId) {
      await this.ensureChurchExists(createNoticeDto.churchId, tenantId);
    }

    const notice = await this.prisma.notice.create({
      data: {
        tenantId,
        churchId: createNoticeDto.churchId ?? null,
        title: createNoticeDto.title,
        message: createNoticeDto.message,
        imageUrl: this.normalizeImageUrl(createNoticeDto.imageUrl),
        targetLabel: createNoticeDto.targetLabel ?? null,
        scheduledAt: createNoticeDto.scheduledAt ?? null,
        status: createNoticeDto.status,
      },
      select: noticeSelect,
    });

    return new NoticeResponseDto(notice);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    updateNoticeDto: UpdateNoticeDto,
  ): Promise<NoticeResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingNotice = await this.findNoticeByIdOrThrow(id, tenantId);

    if (updateNoticeDto.churchId) {
      await this.ensureChurchExists(updateNoticeDto.churchId, tenantId);
    }

    const data: Prisma.NoticeUncheckedUpdateInput = {};

    if ('churchId' in updateNoticeDto) {
      data.churchId = updateNoticeDto.churchId ?? null;
    }

    if (updateNoticeDto.title !== undefined) {
      data.title = updateNoticeDto.title;
    }

    if (updateNoticeDto.message !== undefined) {
      data.message = updateNoticeDto.message;
    }

    if ('imageUrl' in updateNoticeDto) {
      data.imageUrl = this.normalizeImageUrl(updateNoticeDto.imageUrl);
    }

    if ('targetLabel' in updateNoticeDto) {
      data.targetLabel = updateNoticeDto.targetLabel ?? null;
    }

    if ('scheduledAt' in updateNoticeDto) {
      data.scheduledAt = updateNoticeDto.scheduledAt ?? null;
    }

    if (updateNoticeDto.status !== undefined) {
      data.status = updateNoticeDto.status;
    }

    const notice = await this.prisma.notice.update({
      where: { id },
      data,
      select: noticeSelect,
    });

    await this.deleteManagedImageIfReplaced(
      existingNotice.imageUrl,
      notice.imageUrl,
    );

    return new NoticeResponseDto(notice);
  }

  async uploadImage(
    currentUser: AuthenticatedUser,
    id: string,
    file?: UploadedTenantLogoFile,
  ): Promise<{ imageUrl: string }> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingNotice = await this.findNoticeByIdOrThrow(id, tenantId);
    const validatedFile = this.validateNoticeImageFile(file);
    const filename = await this.saveNoticeImageFile(id, validatedFile);
    const nextImageUrl = `${NOTICE_IMAGE_PUBLIC_BASE_PATH}/${filename}`;

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        imageUrl: nextImageUrl,
      },
      select: {
        imageUrl: true,
      },
    });

    await this.deleteManagedImageIfReplaced(
      existingNotice.imageUrl,
      notice.imageUrl,
    );

    return {
      imageUrl: notice.imageUrl ?? nextImageUrl,
    };
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

  private async findNoticeByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<NoticeEntity> {
    const notice = await this.prisma.notice.findFirst({
      where: {
        id,
        tenantId,
      },
      select: noticeSelect,
    });

    if (!notice) {
      throw new NotFoundException('Aviso nao encontrado.');
    }

    return notice;
  }

  private normalizeImageUrl(imageUrl?: string | null): string | null {
    if (typeof imageUrl !== 'string') {
      return null;
    }

    const trimmedImageUrl = imageUrl.trim();

    return trimmedImageUrl.length > 0 ? trimmedImageUrl : null;
  }

  private validateNoticeImageFile(
    file?: UploadedTenantLogoFile,
  ): UploadedTenantLogoFile {
    if (!file) {
      throw new BadRequestException('Envie o arquivo da imagem do aviso.');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'O arquivo enviado para a imagem do aviso esta vazio.',
      );
    }

    if (file.size > NOTICE_IMAGE_MAX_FILE_SIZE) {
      throw new BadRequestException(
        'A imagem do aviso deve ter no maximo 1 MB.',
      );
    }

    const normalizedMimeType = String(file.mimetype ?? '').trim().toLowerCase();
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    const hasAllowedMimeType =
      normalizedMimeType.length > 0 &&
      NOTICE_IMAGE_ALLOWED_MIME_TYPES.has(normalizedMimeType);
    const hasAllowedExtension =
      normalizedExtension.length > 0 &&
      NOTICE_IMAGE_ALLOWED_EXTENSIONS.has(normalizedExtension);

    if (
      (normalizedMimeType && !hasAllowedMimeType) ||
      (normalizedExtension && !hasAllowedExtension) ||
      (!normalizedMimeType && !hasAllowedExtension)
    ) {
      throw new BadRequestException(
        'A imagem do aviso deve ser PNG, JPG, JPEG ou WEBP.',
      );
    }

    return file;
  }

  private async saveNoticeImageFile(
    noticeId: string,
    file: UploadedTenantLogoFile,
  ): Promise<string> {
    const extension = this.resolveNoticeImageExtension(file);
    const safeNoticeId = noticeId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const filename = `${safeNoticeId}-${Date.now()}-${randomUUID()}.${extension}`;
    const destination = join(NOTICE_IMAGE_UPLOAD_DIRECTORY, filename);

    await mkdir(NOTICE_IMAGE_UPLOAD_DIRECTORY, { recursive: true });
    await writeFile(destination, file.buffer);

    return filename;
  }

  private resolveNoticeImageExtension(file: UploadedTenantLogoFile): string {
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    if (NOTICE_IMAGE_ALLOWED_EXTENSIONS.has(normalizedExtension)) {
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
      !normalizedImageUrl.startsWith(`${NOTICE_IMAGE_PUBLIC_BASE_PATH}/`)
    ) {
      return null;
    }

    const filename = normalizedImageUrl.slice(
      NOTICE_IMAGE_PUBLIC_BASE_PATH.length + 1,
    );

    if (!filename || filename !== basename(filename)) {
      return null;
    }

    return join(NOTICE_IMAGE_UPLOAD_DIRECTORY, filename);
  }
}
