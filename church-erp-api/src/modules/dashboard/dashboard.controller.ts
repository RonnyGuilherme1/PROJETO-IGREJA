import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { DashboardCardsDto } from './dto/dashboard-cards.dto';
import { DashboardFinanceByMonthDto } from './dto/dashboard-finance-by-month.dto';
import { DashboardMembersByMonthDto } from './dto/dashboard-members-by-month.dto';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('cards')
  getCards(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<DashboardCardsDto> {
    return this.dashboardService.getCards(currentUser);
  }

  @Get('finance-by-month')
  getFinanceByMonth(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<DashboardFinanceByMonthDto[]> {
    return this.dashboardService.getFinanceByMonth(currentUser);
  }

  @Get('members-by-month')
  getMembersByMonth(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<DashboardMembersByMonthDto[]> {
    return this.dashboardService.getMembersByMonth(currentUser);
  }
}
