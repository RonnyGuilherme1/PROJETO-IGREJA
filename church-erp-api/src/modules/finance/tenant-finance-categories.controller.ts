import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { FinanceCategoryResponseDto } from './dto/finance-category-response.dto';
import { FinanceService } from './finance.service';

@Controller('tenant/financial-categories')
@UseGuards(JwtAuthGuard)
export class TenantFinanceCategoriesController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FinanceCategoryResponseDto[]> {
    return this.financeService.findCategories(currentUser);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createFinanceCategoryDto: CreateFinanceCategoryDto,
  ): Promise<FinanceCategoryResponseDto> {
    return this.financeService.createCategory(
      currentUser,
      createFinanceCategoryDto,
    );
  }
}
