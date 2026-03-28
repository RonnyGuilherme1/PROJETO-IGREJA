import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { NoticeEntity, noticeSelect } from './types/notice.type';

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
        imageUrl: createNoticeDto.imageUrl ?? null,
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
    await this.findNoticeByIdOrThrow(id, tenantId);

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
      data.imageUrl = updateNoticeDto.imageUrl ?? null;
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

    return new NoticeResponseDto(notice);
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
}
