import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { FinanceMonthClosureResponseDto } from './dto/finance-month-closure-response.dto';
import { FinanceMonthReferenceDto } from './dto/finance-month-reference.dto';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceCategoryResponseDto } from './dto/finance-category-response.dto';
import { FinanceTransactionResponseDto } from './dto/finance-transaction-response.dto';
import { FindFinanceTransactionsQueryDto } from './dto/find-finance-transactions-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import { FinanceService, UploadedFinanceReceiptFile } from './finance.service';

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

  @Get('transactions/export')
  async exportTransactions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FindFinanceTransactionsQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const exportFile = await this.financeService.exportTransactions(
      currentUser,
      query,
    );

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportFile.filename}"`,
    );
    response.setHeader('Cache-Control', 'no-store');

    return exportFile.content;
  }

  @Get('transactions/:id')
  findTransactionById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.findTransactionById(currentUser, id);
  }

  @Post('transactions')
  @UseInterceptors(FileInterceptor('receipt'))
  createTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createFinanceTransactionDto: CreateFinanceTransactionDto,
    @UploadedFile() receiptFile?: UploadedFinanceReceiptFile,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.createTransaction(
      currentUser,
      createFinanceTransactionDto,
      receiptFile,
    );
  }

  @Patch('transactions/:id')
  @UseInterceptors(FileInterceptor('receipt'))
  updateTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateFinanceTransactionDto: UpdateFinanceTransactionDto,
    @UploadedFile() receiptFile?: UploadedFinanceReceiptFile,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.updateTransaction(
      currentUser,
      id,
      updateFinanceTransactionDto,
      receiptFile,
    );
  }

  @Get('monthly-closure')
  getMonthlyClosure(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() monthReferenceDto: FinanceMonthReferenceDto,
  ): Promise<FinanceMonthClosureResponseDto> {
    return this.financeService.getMonthlyClosure(currentUser, monthReferenceDto);
  }

  @Post('monthly-closure')
  closeMonth(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() monthReferenceDto: FinanceMonthReferenceDto,
  ): Promise<FinanceMonthClosureResponseDto> {
    return this.financeService.closeMonth(currentUser, monthReferenceDto);
  }

  @Patch('transactions/:id/cancel')
  cancelTransaction(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FinanceTransactionResponseDto> {
    return this.financeService.cancelTransaction(currentUser, id);
  }
}
