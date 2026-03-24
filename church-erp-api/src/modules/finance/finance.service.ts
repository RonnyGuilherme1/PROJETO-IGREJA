import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FinanceTransactionStatus,
  FinanceType,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceCategoryResponseDto } from './dto/finance-category-response.dto';
import { FinanceTransactionResponseDto } from './dto/finance-transaction-response.dto';
import { FindFinanceTransactionsQueryDto } from './dto/find-finance-transactions-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import {
  FinanceCategoryEntity,
  financeCategorySelect,
} from './types/finance-category.type';
import {
  FinanceTransactionEntity,
  financeTransactionSelect,
} from './types/finance-transaction.type';

export const DEFAULT_FINANCE_CATEGORIES = [
  {
    name: 'Receitas Gerais',
    type: FinanceType.ENTRY,
  },
  {
    name: 'Despesas Gerais',
    type: FinanceType.EXPENSE,
  },
] as const;

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findCategories(
    currentUser: AuthenticatedUser,
  ): Promise<FinanceCategoryResponseDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const categories = await this.prisma.financeCategory.findMany({
      where: {
        tenantId,
      },
      select: financeCategorySelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    return categories.map((category) => new FinanceCategoryResponseDto(category));
  }

  async createCategory(
    currentUser: AuthenticatedUser,
    createFinanceCategoryDto: CreateFinanceCategoryDto,
  ): Promise<FinanceCategoryResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const category = await this.prisma.financeCategory.create({
      data: {
        tenantId,
        name: createFinanceCategoryDto.name,
        type: createFinanceCategoryDto.type,
        active: createFinanceCategoryDto.active ?? true,
      },
      select: financeCategorySelect,
    });

    return new FinanceCategoryResponseDto(category);
  }

  async findTransactions(
    currentUser: AuthenticatedUser,
    query: FindFinanceTransactionsQueryDto,
  ): Promise<FinanceTransactionResponseDto[]> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const transactions = await this.prisma.financeTransaction.findMany({
      where: this.buildTransactionWhere(query, tenantId),
      select: financeTransactionSelect,
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    });

    return transactions.map(
      (transaction) => new FinanceTransactionResponseDto(transaction),
    );
  }

  async findTransactionById(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const transaction = await this.findTransactionByIdOrThrow(id, tenantId);

    return new FinanceTransactionResponseDto(transaction);
  }

  async createTransaction(
    currentUser: AuthenticatedUser,
    createFinanceTransactionDto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.ensureChurchExists(createFinanceTransactionDto.churchId, tenantId);

    const category = await this.ensureCategoryCanBeUsed(
      createFinanceTransactionDto.categoryId,
      createFinanceTransactionDto.type,
      tenantId,
    );

    const transaction = await this.prisma.financeTransaction.create({
      data: {
        tenantId,
        churchId: createFinanceTransactionDto.churchId,
        categoryId: category.id,
        type: category.type,
        description: createFinanceTransactionDto.description,
        amount: new Prisma.Decimal(createFinanceTransactionDto.amount),
        transactionDate: createFinanceTransactionDto.transactionDate,
        notes: createFinanceTransactionDto.notes ?? null,
        createdByUserId: currentUser.id,
      },
      select: financeTransactionSelect,
    });

    return new FinanceTransactionResponseDto(transaction);
  }

  async updateTransaction(
    currentUser: AuthenticatedUser,
    id: string,
    updateFinanceTransactionDto: UpdateFinanceTransactionDto,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const existingTransaction = await this.findTransactionByIdOrThrow(id, tenantId);
    const effectiveChurchId =
      updateFinanceTransactionDto.churchId ?? existingTransaction.churchId;
    const effectiveCategoryId =
      updateFinanceTransactionDto.categoryId ?? existingTransaction.categoryId;
    const shouldSyncCategoryType =
      updateFinanceTransactionDto.categoryId !== undefined ||
      updateFinanceTransactionDto.type !== undefined;

    if (updateFinanceTransactionDto.churchId !== undefined) {
      await this.ensureChurchExists(updateFinanceTransactionDto.churchId, tenantId);
    }

    const category = shouldSyncCategoryType
      ? await this.ensureCategoryCanBeUsed(
          effectiveCategoryId,
          updateFinanceTransactionDto.type,
          tenantId,
        )
      : null;

    const data: Prisma.FinanceTransactionUncheckedUpdateInput = {};

    if (updateFinanceTransactionDto.churchId !== undefined) {
      data.churchId = effectiveChurchId;
    }

    if (updateFinanceTransactionDto.categoryId !== undefined) {
      data.categoryId = category!.id;
    }

    if (shouldSyncCategoryType && category) {
      data.type = category.type;
    }

    if (updateFinanceTransactionDto.description !== undefined) {
      data.description = updateFinanceTransactionDto.description;
    }

    if (updateFinanceTransactionDto.amount !== undefined) {
      data.amount = new Prisma.Decimal(updateFinanceTransactionDto.amount);
    }

    if (updateFinanceTransactionDto.transactionDate !== undefined) {
      data.transactionDate = updateFinanceTransactionDto.transactionDate;
    }

    if ('notes' in updateFinanceTransactionDto) {
      data.notes = updateFinanceTransactionDto.notes ?? null;
    }

    if (updateFinanceTransactionDto.status !== undefined) {
      data.status = updateFinanceTransactionDto.status;
    }

    const transaction = await this.prisma.financeTransaction.update({
      where: { id },
      data,
      select: financeTransactionSelect,
    });

    return new FinanceTransactionResponseDto(transaction);
  }

  async cancelTransaction(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.findTransactionByIdOrThrow(id, tenantId);

    const transaction = await this.prisma.financeTransaction.update({
      where: { id },
      data: {
        status: FinanceTransactionStatus.CANCELLED,
      },
      select: financeTransactionSelect,
    });

    return new FinanceTransactionResponseDto(transaction);
  }

  private buildTransactionWhere(
    query: FindFinanceTransactionsQueryDto,
    tenantId: string,
  ): Prisma.FinanceTransactionWhereInput {
    const where: Prisma.FinanceTransactionWhereInput = {
      tenantId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.churchId) {
      where.churchId = query.churchId;
    }

    if (query.startDate || query.endDate) {
      where.transactionDate = {};

      if (query.startDate) {
        where.transactionDate.gte = query.startDate;
      }

      if (query.endDate) {
        where.transactionDate.lte = query.endDate;
      }
    }

    return where;
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }
  }

  private ensureCanManage(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.TESOUREIRO
    ) {
      throw new ForbiddenException(
        'Acesso permitido apenas para administradores e tesoureiros.',
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
      select: { id: true },
    });

    if (!church) {
      throw new NotFoundException('Igreja vinculada nao encontrada.');
    }
  }

  private async ensureCategoryCanBeUsed(
    categoryId: string,
    type: FinanceType | undefined,
    tenantId: string,
  ): Promise<FinanceCategoryEntity> {
    const category = await this.prisma.financeCategory.findFirst({
      where: {
        id: categoryId,
        tenantId,
      },
      select: financeCategorySelect,
    });

    if (!category) {
      throw new NotFoundException('Categoria financeira nao encontrada.');
    }

    if (!category.active) {
      throw new BadRequestException('Categoria financeira inativa.');
    }

    if (type !== undefined && category.type !== type) {
      throw new BadRequestException(
        'O tipo da movimentacao deve ser igual ao tipo da categoria.',
      );
    }

    return category;
  }

  private async findTransactionByIdOrThrow(
    id: string,
    tenantId: string,
  ): Promise<FinanceTransactionEntity> {
    const transaction = await this.prisma.financeTransaction.findFirst({
      where: {
        id,
        tenantId,
      },
      select: financeTransactionSelect,
    });

    if (!transaction) {
      throw new NotFoundException('Movimentacao financeira nao encontrada.');
    }

    return transaction;
  }
}
