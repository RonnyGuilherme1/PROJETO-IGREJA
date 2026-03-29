import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NoticeDeliveryStatus, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { noticeSelect } from '../notices/types/notice.type';
import { NoticeDeliveryResponseDto } from './dto/notice-delivery-response.dto';
import { SendNoticeDto } from './dto/send-notice.dto';
import { MetaWhatsappProviderService } from './meta-whatsapp-provider.service';
import { noticeDeliverySelect } from './types/notice-delivery.type';
import { WhatsappMessagePayloadBuilderService } from './whatsapp-message-payload-builder.service';
import { WhatsappDestinationsService } from './whatsapp-destinations.service';
import { WhatsappIntegrationService } from './whatsapp-integration.service';

const NOTICE_DELIVERY_CHANNEL = 'WHATSAPP';

@Injectable()
export class NoticeDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappIntegrationService: WhatsappIntegrationService,
    private readonly whatsappDestinationsService: WhatsappDestinationsService,
    private readonly whatsappMessagePayloadBuilderService: WhatsappMessagePayloadBuilderService,
    private readonly metaWhatsappProviderService: MetaWhatsappProviderService,
  ) {}

  async send(
    currentUser: AuthenticatedUser,
    noticeId: string,
    sendNoticeDto: SendNoticeDto,
  ): Promise<NoticeDeliveryResponseDto> {
    this.ensureCanSend(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const notice = await this.findNoticeByIdOrThrow(noticeId, tenantId);
    const destination =
      await this.whatsappDestinationsService.findDestinationByIdForTenantOrThrow(
        tenantId,
        sendNoticeDto.destinationId,
      );
    const config = await this.whatsappIntegrationService.findConfigByTenantId(
      tenantId,
    );

    const pendingDelivery = await this.prisma.noticeDelivery.create({
      data: {
        tenantId,
        noticeId: notice.id,
        destinationId: destination.id,
        channel: NOTICE_DELIVERY_CHANNEL,
        status: NoticeDeliveryStatus.PENDING,
      },
      select: noticeDeliverySelect,
    });

    try {
      this.ensureReadyForOfficialSend(config, destination.enabled);

      const payload = this.whatsappMessagePayloadBuilderService.build({
        title: notice.title,
        message: notice.message,
        imageUrl: notice.imageUrl,
        finalCaption: sendNoticeDto.finalCaption ?? null,
        destinationType: destination.type,
        groupId: destination.groupId,
        phoneNumber: destination.phoneNumber,
      });

      const providerResult = await this.metaWhatsappProviderService.sendMessage(
        {
          provider: config.provider,
          connectionStatus: config.connectionStatus,
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
        },
        payload,
      );

      const sentDelivery = await this.prisma.noticeDelivery.update({
        where: { id: pendingDelivery.id },
        data: {
          status: NoticeDeliveryStatus.SENT,
          providerMessageId: providerResult.providerMessageId,
          sentAt: new Date(),
          errorMessage: null,
        },
        select: noticeDeliverySelect,
      });

      return new NoticeDeliveryResponseDto(sentDelivery);
    } catch (error) {
      const errorMessage = this.resolveErrorMessage(error);
      const failedDelivery = await this.prisma.noticeDelivery.update({
        where: { id: pendingDelivery.id },
        data: {
          status: NoticeDeliveryStatus.FAILED,
          errorMessage,
        },
        select: noticeDeliverySelect,
      });

      return new NoticeDeliveryResponseDto(failedDelivery);
    }
  }

  private ensureCanSend(currentUser: AuthenticatedUser): void {
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

  private async findNoticeByIdOrThrow(noticeId: string, tenantId: string) {
    const notice = await this.prisma.notice.findFirst({
      where: {
        id: noticeId,
        tenantId,
      },
      select: noticeSelect,
    });

    if (!notice) {
      throw new NotFoundException('Aviso nao encontrado.');
    }

    return notice;
  }

  private ensureReadyForOfficialSend(
    config: Awaited<ReturnType<WhatsappIntegrationService['findConfigByTenantId']>>,
    destinationEnabled: boolean,
  ): asserts config is NonNullable<
    Awaited<ReturnType<WhatsappIntegrationService['findConfigByTenantId']>>
  > {
    if (!config) {
      throw new BadRequestException(
        'A integracao oficial do WhatsApp ainda nao foi configurada para este tenant.',
      );
    }

    if (!config.enabled) {
      throw new BadRequestException(
        'A integracao oficial do WhatsApp esta desabilitada para este tenant.',
      );
    }

    if (!destinationEnabled) {
      throw new BadRequestException(
        'O destino informado esta inativo para envio de avisos.',
      );
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (
        response &&
        typeof response === 'object' &&
        'message' in response
      ) {
        const message = Array.isArray(response.message)
          ? response.message.join(', ')
          : typeof response.message === 'string'
            ? response.message.trim()
            : '';

        if (message) {
          return message;
        }
      }
    }

    if (error instanceof Error) {
      const message = error.message.trim();

      return message.length > 0
        ? message
        : 'Falha inesperada ao enviar o aviso pelo WhatsApp.';
    }

    return 'Falha inesperada ao enviar o aviso pelo WhatsApp.';
  }
}
