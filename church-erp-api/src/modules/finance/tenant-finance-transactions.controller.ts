import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceTransactionResponseDto } from './dto/finance-transaction-response.dto';
import { FindFinanceTransactionsQueryDto } from './dto/find-finance-transactions-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import { FinanceService } from './finance.service';

@Controller('tenant/financial-transactions')
@UseGuards(JwtAuthGuard)
export class TenantFinanceTransactionsController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  findTransactions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FindFinanceTransactionsQueryDto,
  ): Promise<FinanceTransactionResponseDto[]> {
    return this.financeService.findTransactions(currentUser, query);
  }

  @Get(':id')
  findTransactionById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.findTransactionById(currentUser, id);
  }

  @Post()
  createTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createFinanceTransactionDto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.createTransaction(
      currentUser,
      createFinanceTransactionDto,
    );
  }

  @Put(':id')
  updateByPut(
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

  @Patch(':id')
  update(
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

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.cancelTransaction(currentUser, id);
  }
}
