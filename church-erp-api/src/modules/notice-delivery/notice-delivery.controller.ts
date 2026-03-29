import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { NoticeDeliveryResponseDto } from './dto/notice-delivery-response.dto';
import { SendNoticeDto } from './dto/send-notice.dto';
import { NoticeDeliveryService } from './notice-delivery.service';

@Controller('notice-delivery/notices')
@UseGuards(JwtAuthGuard)
export class NoticeDeliveryController {
  constructor(private readonly noticeDeliveryService: NoticeDeliveryService) {}

  @Post(':noticeId/send')
  send(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('noticeId', new ParseUUIDPipe()) noticeId: string,
    @Body() sendNoticeDto: SendNoticeDto,
  ): Promise<NoticeDeliveryResponseDto> {
    return this.noticeDeliveryService.send(currentUser, noticeId, sendNoticeDto);
  }
}
