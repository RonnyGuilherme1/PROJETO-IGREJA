import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceCategoryResponseDto } from './dto/finance-category-response.dto';
import { FinanceTransactionResponseDto } from './dto/finance-transaction-response.dto';
import { FindFinanceTransactionsQueryDto } from './dto/find-finance-transactions-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('categories')
  findCategories(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<FinanceCategoryResponseDto[]> {
    return this.financeService.findCategories(currentUser);
  }

  @Post('categories')
  createCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createFinanceCategoryDto: CreateFinanceCategoryDto,
  ): Promise<FinanceCategoryResponseDto> {
    return this.financeService.createCategory(
      currentUser,
      createFinanceCategoryDto,
    );
  }

  @Get('transactions')
  findTransactions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FindFinanceTransactionsQueryDto,
  ): Promise<FinanceTransactionResponseDto[]> {
    return this.financeService.findTransactions(currentUser, query);
  }

  @Get('transactions/:id')
  findTransactionById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.findTransactionById(currentUser, id);
  }

  @Post('transactions')
  createTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createFinanceTransactionDto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.createTransaction(
      currentUser,
      createFinanceTransactionDto,
    );
  }

  @Patch('transactions/:id')
  updateTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateFinanceTransactionDto: UpdateFinanceTransactionDto,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.updateTransaction(
      currentUser,
      id,
      updateFinanceTransactionDto,
    );
  }

  @Patch('transactions/:id/cancel')
  cancelTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.cancelTransaction(currentUser, id);
  }
}
