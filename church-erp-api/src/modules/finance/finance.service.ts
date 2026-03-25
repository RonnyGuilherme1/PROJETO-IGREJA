import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import {
  FinanceTransactionStatus,
  FinanceType,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TENANT_LOGO_UPLOAD_ROOT } from '../tenants/constants/tenant-logo-upload.constants';
import { CreateFinanceCategoryDto } from './dto/create-finance-category.dto';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { FinanceCategoryResponseDto } from './dto/finance-category-response.dto';
import { FinanceMonthClosureResponseDto } from './dto/finance-month-closure-response.dto';
import { FinanceMonthReferenceDto } from './dto/finance-month-reference.dto';
import { FinanceTransactionResponseDto } from './dto/finance-transaction-response.dto';
import { FindFinanceTransactionsQueryDto } from './dto/find-finance-transactions-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import {
  FinanceCategoryEntity,
  financeCategorySelect,
} from './types/finance-category.type';

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

const FINANCE_VIEW_ROLES = new Set<UserRole>(Object.values(UserRole));
const FINANCE_MANAGE_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.TESOUREIRO,
]);
const FINANCE_RECEIPT_MAX_FILE_SIZE = 5 * 1024 * 1024;
const FINANCE_RECEIPT_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);
const FINANCE_RECEIPT_ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);
const FINANCE_RECEIPT_PUBLIC_BASE_PATH = '/api/uploads/finance-receipts';
const FINANCE_RECEIPT_UPLOAD_DIRECTORY = join(
  TENANT_LOGO_UPLOAD_ROOT,
  'finance-receipts',
);

const financeTransactionSelect =
  Prisma.validator<Prisma.FinanceTransactionSelect>()({
    id: true,
    churchId: true,
    categoryId: true,
    type: true,
    description: true,
    amount: true,
    transactionDate: true,
    notes: true,
    receiptUrl: true,
    status: true,
    createdByUserId: true,
    createdAt: true,
    updatedAt: true,
  });

const financeMonthClosureSelect =
  Prisma.validator<Prisma.FinanceMonthClosureSelect>()({
    year: true,
    month: true,
    incomeAmount: true,
    expenseAmount: true,
    balanceAmount: true,
    transactionCount: true,
    closedAt: true,
    closedByUserId: true,
  });

const financeMonthSummaryTransactionSelect =
  Prisma.validator<Prisma.FinanceTransactionSelect>()({
    amount: true,
    type: true,
    status: true,
  });

const financeTransactionExportSelect =
  Prisma.validator<Prisma.FinanceTransactionSelect>()({
    id: true,
    type: true,
    description: true,
    amount: true,
    transactionDate: true,
    notes: true,
    receiptUrl: true,
    status: true,
    church: {
      select: {
        name: true,
      },
    },
    category: {
      select: {
        name: true,
      },
    },
  });

type FinanceTransactionEntity = Prisma.FinanceTransactionGetPayload<{
  select: typeof financeTransactionSelect;
}>;

type FinanceMonthClosureEntity = Prisma.FinanceMonthClosureGetPayload<{
  select: typeof financeMonthClosureSelect;
}>;

type FinanceTransactionExportEntity = Prisma.FinanceTransactionGetPayload<{
  select: typeof financeTransactionExportSelect;
}>;

type CurrentUserWithPlatformRole = AuthenticatedUser & {
  platformRole?: string | null;
};

type FinanceMonthSummarySnapshot = {
  year: number;
  month: number;
  closed: boolean;
  closedAt: Date | null;
  closedByUserId: string | null;
  incomeAmount: Prisma.Decimal;
  expenseAmount: Prisma.Decimal;
  balanceAmount: Prisma.Decimal;
  transactionCount: number;
};

export interface UploadedFinanceReceiptFile {
  buffer: Buffer;
  size: number;
  mimetype?: string;
  originalname?: string;
}

export interface FinanceTransactionsExportResult {
  filename: string;
  content: string;
}

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

    return categories.map(
      (category) => new FinanceCategoryResponseDto(category),
    );
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

  async exportTransactions(
    currentUser: AuthenticatedUser,
    query: FindFinanceTransactionsQueryDto,
  ): Promise<FinanceTransactionsExportResult> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const transactions = await this.prisma.financeTransaction.findMany({
      where: this.buildTransactionWhere(query, tenantId),
      select: financeTransactionExportSelect,
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    });

    const rows = [
      [
        'Data',
        'Tipo',
        'Status',
        'Descricao',
        'Categoria',
        'Igreja',
        'Valor',
        'Comprovante',
        'Observacoes',
      ],
      ...transactions.map((transaction) =>
        this.buildExportRow(transaction),
      ),
    ];

    return {
      filename: this.buildExportFilename(query),
      content: `\uFEFF${rows.map((row) => this.toCsvRow(row)).join('\r\n')}`,
    };
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
    receiptFile?: UploadedFinanceReceiptFile,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    await this.ensureChurchExists(createFinanceTransactionDto.churchId, tenantId);

    const category = await this.ensureCategoryCanBeUsed(
      createFinanceTransactionDto.categoryId,
      createFinanceTransactionDto.type,
      tenantId,
    );

    await this.ensureMonthIsOpen(
      tenantId,
      createFinanceTransactionDto.transactionDate,
      'novas movimentacoes',
    );

    const uploadedReceiptUrl = receiptFile
      ? await this.saveReceiptFile(
          tenantId,
          this.validateReceiptFile(receiptFile),
        )
      : null;
    const receiptUrl =
      uploadedReceiptUrl ??
      this.normalizeReceiptUrl(createFinanceTransactionDto.receiptUrl);

    try {
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
          receiptUrl,
          createdByUserId: currentUser.id,
        },
        select: financeTransactionSelect,
      });

      return new FinanceTransactionResponseDto(transaction);
    } catch (error) {
      await this.deleteManagedReceiptIfReplaced(uploadedReceiptUrl, null);
      throw error;
    }
  }

  async updateTransaction(
    currentUser: AuthenticatedUser,
    id: string,
    updateFinanceTransactionDto: UpdateFinanceTransactionDto,
    receiptFile?: UploadedFinanceReceiptFile,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);

    const existingTransaction = await this.findTransactionByIdOrThrow(id, tenantId);
    const effectiveChurchId =
      updateFinanceTransactionDto.churchId ?? existingTransaction.churchId;
    const effectiveCategoryId =
      updateFinanceTransactionDto.categoryId ?? existingTransaction.categoryId;
    const effectiveTransactionDate =
      updateFinanceTransactionDto.transactionDate ??
      existingTransaction.transactionDate;
    const shouldSyncCategoryType =
      updateFinanceTransactionDto.categoryId !== undefined ||
      updateFinanceTransactionDto.type !== undefined;

    await this.ensureMonthIsOpen(
      tenantId,
      existingTransaction.transactionDate,
      'alteracoes',
    );

    if (
      !this.isSameMonth(
        existingTransaction.transactionDate,
        effectiveTransactionDate,
      )
    ) {
      await this.ensureMonthIsOpen(
        tenantId,
        effectiveTransactionDate,
        'alteracoes',
      );
    }

    if (updateFinanceTransactionDto.churchId !== undefined) {
      await this.ensureChurchExists(
        updateFinanceTransactionDto.churchId,
        tenantId,
      );
    }

    const category = shouldSyncCategoryType
      ? await this.ensureCategoryCanBeUsed(
          effectiveCategoryId,
          updateFinanceTransactionDto.type,
          tenantId,
        )
      : null;
    const uploadedReceiptUrl = receiptFile
      ? await this.saveReceiptFile(
          tenantId,
          this.validateReceiptFile(receiptFile),
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

    if (uploadedReceiptUrl) {
      data.receiptUrl = uploadedReceiptUrl;
    } else if ('receiptUrl' in updateFinanceTransactionDto) {
      data.receiptUrl = this.normalizeReceiptUrl(
        updateFinanceTransactionDto.receiptUrl,
      );
    }

    if (updateFinanceTransactionDto.status !== undefined) {
      data.status = updateFinanceTransactionDto.status;
    }

    try {
      const transaction = await this.prisma.financeTransaction.update({
        where: { id },
        data,
        select: financeTransactionSelect,
      });

      await this.deleteManagedReceiptIfReplaced(
        existingTransaction.receiptUrl,
        transaction.receiptUrl,
      );

      return new FinanceTransactionResponseDto(transaction);
    } catch (error) {
      await this.deleteManagedReceiptIfReplaced(uploadedReceiptUrl, null);
      throw error;
    }
  }

  async getMonthlyClosure(
    currentUser: AuthenticatedUser,
    monthReferenceDto: FinanceMonthReferenceDto,
  ): Promise<FinanceMonthClosureResponseDto> {
    this.ensureCanView(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingClosure = await this.findMonthClosure(
      tenantId,
      monthReferenceDto.year,
      monthReferenceDto.month,
    );

    if (existingClosure) {
      return new FinanceMonthClosureResponseDto({
        ...existingClosure,
        closed: true,
      });
    }

    const summary = await this.calculateMonthSummary(
      tenantId,
      monthReferenceDto.year,
      monthReferenceDto.month,
    );

    return new FinanceMonthClosureResponseDto(summary);
  }

  async closeMonth(
    currentUser: AuthenticatedUser,
    monthReferenceDto: FinanceMonthReferenceDto,
  ): Promise<FinanceMonthClosureResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingClosure = await this.findMonthClosure(
      tenantId,
      monthReferenceDto.year,
      monthReferenceDto.month,
    );

    if (existingClosure) {
      throw new BadRequestException(
        `O mes ${this.formatMonthReference(monthReferenceDto.year, monthReferenceDto.month)} ja foi fechado.`,
      );
    }

    const summary = await this.calculateMonthSummary(
      tenantId,
      monthReferenceDto.year,
      monthReferenceDto.month,
    );

    const closure = await this.prisma.financeMonthClosure.create({
      data: {
        tenantId,
        year: monthReferenceDto.year,
        month: monthReferenceDto.month,
        incomeAmount: summary.incomeAmount,
        expenseAmount: summary.expenseAmount,
        balanceAmount: summary.balanceAmount,
        transactionCount: summary.transactionCount,
        closedByUserId: currentUser.id,
      },
      select: financeMonthClosureSelect,
    });

    return new FinanceMonthClosureResponseDto({
      ...closure,
      closed: true,
    });
  }

  async cancelTransaction(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<FinanceTransactionResponseDto> {
    this.ensureCanManage(currentUser);
    const tenantId = this.ensureTenantAccess(currentUser);
    const existingTransaction = await this.findTransactionByIdOrThrow(id, tenantId);

    await this.ensureMonthIsOpen(
      tenantId,
      existingTransaction.transactionDate,
      'cancelamentos',
    );

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
    const normalizedDateRange = this.normalizeTransactionDateRange(
      query.startDate,
      query.endDate,
    );

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.churchId) {
      where.churchId = query.churchId;
    }

    if (normalizedDateRange.startDate || normalizedDateRange.endDate) {
      where.transactionDate = {};

      if (normalizedDateRange.startDate) {
        where.transactionDate.gte = normalizedDateRange.startDate;
      }

      if (normalizedDateRange.endDate) {
        where.transactionDate.lte = normalizedDateRange.endDate;
      }
    }

    return where;
  }

  private normalizeTransactionDateRange(
    startDate?: Date,
    endDate?: Date,
  ): { startDate?: Date; endDate?: Date } {
    if (!startDate && !endDate) {
      return {};
    }

    const normalizedStartDate = startDate
      ? this.startOfDay(startDate)
      : undefined;
    const normalizedEndDate = endDate ? this.endOfDay(endDate) : undefined;

    if (
      normalizedStartDate &&
      normalizedEndDate &&
      normalizedStartDate > normalizedEndDate
    ) {
      return {
        startDate: this.startOfDay(normalizedEndDate),
        endDate: this.endOfDay(normalizedStartDate),
      };
    }

    return {
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    };
  }

  private startOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private async calculateMonthSummary(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<FinanceMonthSummarySnapshot> {
    const { startDate, endDate } = this.getMonthDateRange(year, month);
    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        tenantId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: financeMonthSummaryTransactionSelect,
    });

    let incomeAmount = new Prisma.Decimal(0);
    let expenseAmount = new Prisma.Decimal(0);

    for (const transaction of transactions) {
      if (transaction.status === FinanceTransactionStatus.CANCELLED) {
        continue;
      }

      if (transaction.type === FinanceType.ENTRY) {
        incomeAmount = incomeAmount.add(transaction.amount);
        continue;
      }

      expenseAmount = expenseAmount.add(transaction.amount);
    }

    return {
      year,
      month,
      closed: false,
      closedAt: null,
      closedByUserId: null,
      incomeAmount,
      expenseAmount,
      balanceAmount: incomeAmount.sub(expenseAmount),
      transactionCount: transactions.length,
    };
  }

  private getMonthDateRange(
    year: number,
    month: number,
  ): { startDate: Date; endDate: Date } {
    return {
      startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
      endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }

  private async ensureMonthIsOpen(
    tenantId: string,
    transactionDate: Date,
    operationLabel: string,
  ): Promise<void> {
    const { year, month } = this.getYearMonthFromDate(transactionDate);
    const closure = await this.findMonthClosure(tenantId, year, month);

    if (!closure) {
      return;
    }

    throw new BadRequestException(
      `O mes ${this.formatMonthReference(year, month)} ja foi fechado e nao permite ${operationLabel}.`,
    );
  }

  private async findMonthClosure(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<FinanceMonthClosureEntity | null> {
    return this.prisma.financeMonthClosure.findUnique({
      where: {
        tenantId_year_month: {
          tenantId,
          year,
          month,
        },
      },
      select: financeMonthClosureSelect,
    });
  }

  private getYearMonthFromDate(value: Date): { year: number; month: number } {
    const [year, month] = this.toIsoDateString(value)
      .slice(0, 7)
      .split('-')
      .map((part) => Number(part));

    return { year, month };
  }

  private isSameMonth(left: Date, right: Date): boolean {
    const leftReference = this.getYearMonthFromDate(left);
    const rightReference = this.getYearMonthFromDate(right);

    return (
      leftReference.year === rightReference.year &&
      leftReference.month === rightReference.month
    );
  }

  private formatMonthReference(year: number, month: number): string {
    return `${String(month).padStart(2, '0')}/${year}`;
  }

  private buildExportRow(transaction: FinanceTransactionExportEntity): string[] {
    return [
      this.toIsoDateString(transaction.transactionDate),
      this.getFinanceTypeLabel(transaction.type),
      this.getFinanceTransactionStatusLabel(transaction.status),
      transaction.description,
      transaction.category.name,
      transaction.church.name,
      transaction.amount.toString(),
      transaction.receiptUrl ?? '',
      transaction.notes ?? '',
    ];
  }

  private buildExportFilename(query: FindFinanceTransactionsQueryDto): string {
    const parts = ['financeiro'];

    if (query.startDate) {
      parts.push(this.toIsoDateString(query.startDate));
    }

    if (query.endDate) {
      parts.push(this.toIsoDateString(query.endDate));
    }

    if (!query.startDate && !query.endDate) {
      parts.push(this.toIsoDateString(new Date()));
    }

    return `${parts.join('-')}.csv`;
  }

  private toCsvRow(values: string[]): string {
    return values
      .map((value) => {
        const normalizedValue = value.replace(/"/g, '""');

        if (/[;"\r\n]/.test(normalizedValue)) {
          return `"${normalizedValue}"`;
        }

        return normalizedValue;
      })
      .join(';');
  }

  private toIsoDateString(value: Date): string {
    return new Date(value).toISOString().slice(0, 10);
  }

  private getFinanceTypeLabel(type: FinanceType): string {
    return type === FinanceType.EXPENSE ? 'Saida' : 'Entrada';
  }

  private getFinanceTransactionStatusLabel(
    status: FinanceTransactionStatus,
  ): string {
    return status === FinanceTransactionStatus.CANCELLED
      ? 'Cancelada'
      : 'Ativa';
  }

  private normalizeReceiptUrl(receiptUrl?: string | null): string | null {
    if (typeof receiptUrl !== 'string') {
      return null;
    }

    const trimmedReceiptUrl = receiptUrl.trim();

    return trimmedReceiptUrl.length > 0 ? trimmedReceiptUrl : null;
  }

  private validateReceiptFile(
    file?: UploadedFinanceReceiptFile,
  ): UploadedFinanceReceiptFile {
    if (!file) {
      throw new BadRequestException('Envie o comprovante da movimentacao.');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'O arquivo enviado para o comprovante esta vazio.',
      );
    }

    if (file.size > FINANCE_RECEIPT_MAX_FILE_SIZE) {
      throw new BadRequestException(
        'O comprovante deve ter no maximo 5 MB.',
      );
    }

    const normalizedMimeType = this.normalizeReceiptMimeType(file.mimetype);
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();
    const hasAllowedMimeType =
      normalizedMimeType.length > 0 &&
      FINANCE_RECEIPT_ALLOWED_MIME_TYPES.has(normalizedMimeType);
    const hasAllowedExtension =
      normalizedExtension.length > 0 &&
      FINANCE_RECEIPT_ALLOWED_EXTENSIONS.has(normalizedExtension);

    if (
      (normalizedMimeType && !hasAllowedMimeType) ||
      (normalizedExtension && !hasAllowedExtension) ||
      (!normalizedMimeType && !hasAllowedExtension)
    ) {
      throw new BadRequestException(
        'O comprovante deve ser PDF, PNG, JPG, JPEG ou WEBP.',
      );
    }

    return file;
  }

  private normalizeReceiptMimeType(mimeType?: string | null): string {
    const normalizedMimeType = String(mimeType ?? '').trim().toLowerCase();

    if (normalizedMimeType === 'image/jpg') {
      return 'image/jpeg';
    }

    return normalizedMimeType;
  }

  private async saveReceiptFile(
    tenantId: string,
    file: UploadedFinanceReceiptFile,
  ): Promise<string> {
    const extension = this.resolveReceiptExtension(file);
    const safeTenantId = tenantId.replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const filename = `${safeTenantId}-${Date.now()}-${randomUUID()}.${extension}`;
    const destination = join(FINANCE_RECEIPT_UPLOAD_DIRECTORY, filename);

    await mkdir(FINANCE_RECEIPT_UPLOAD_DIRECTORY, { recursive: true });
    await writeFile(destination, file.buffer);

    return `${FINANCE_RECEIPT_PUBLIC_BASE_PATH}/${filename}`;
  }

  private resolveReceiptExtension(file: UploadedFinanceReceiptFile): string {
    const normalizedExtension = extname(file.originalname ?? '')
      .trim()
      .toLowerCase();

    if (FINANCE_RECEIPT_ALLOWED_EXTENSIONS.has(normalizedExtension)) {
      return normalizedExtension.slice(1);
    }

    switch (this.normalizeReceiptMimeType(file.mimetype)) {
      case 'application/pdf':
        return 'pdf';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/jpeg':
        return 'jpg';
      default:
        throw new BadRequestException(
          'Nao foi possivel determinar a extensao do comprovante enviado.',
        );
    }
  }

  private async deleteManagedReceiptIfReplaced(
    previousReceiptUrl?: string | null,
    nextReceiptUrl?: string | null,
  ): Promise<void> {
    const previousFilePath = this.resolveManagedReceiptFilePath(previousReceiptUrl);
    const normalizedPreviousReceiptUrl = this.normalizeReceiptUrl(previousReceiptUrl);
    const normalizedNextReceiptUrl = this.normalizeReceiptUrl(nextReceiptUrl);

    if (
      !previousFilePath ||
      normalizedPreviousReceiptUrl === normalizedNextReceiptUrl
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

  private resolveManagedReceiptFilePath(
    receiptUrl?: string | null,
  ): string | null {
    const normalizedReceiptUrl = this.normalizeReceiptUrl(receiptUrl);

    if (
      !normalizedReceiptUrl ||
      !normalizedReceiptUrl.startsWith(`${FINANCE_RECEIPT_PUBLIC_BASE_PATH}/`)
    ) {
      return null;
    }

    const filename = normalizedReceiptUrl.slice(
      FINANCE_RECEIPT_PUBLIC_BASE_PATH.length + 1,
    );

    if (!filename || filename !== basename(filename)) {
      return null;
    }

    return join(FINANCE_RECEIPT_UPLOAD_DIRECTORY, filename);
  }

  private ensureCanView(currentUser: AuthenticatedUser): void {
    this.ensureTenantRole(
      currentUser,
      FINANCE_VIEW_ROLES,
      'Acesso permitido apenas para perfis do tenant.',
    );
  }

  private ensureCanManage(currentUser: AuthenticatedUser): void {
    this.ensureTenantRole(
      currentUser,
      FINANCE_MANAGE_ROLES,
      'Acesso permitido apenas para administradores e tesoureiros.',
    );
  }

  private ensureTenantRole(
    currentUser: AuthenticatedUser,
    allowedRoles: ReadonlySet<UserRole>,
    message: string,
  ): void {
    if (!currentUser) {
      throw new ForbiddenException('Acesso nao autorizado.');
    }

    if (
      this.isPlatformUser(currentUser) ||
      !allowedRoles.has(currentUser.role)
    ) {
      throw new ForbiddenException(message);
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

  private isPlatformUser(currentUser: AuthenticatedUser): boolean {
    return Boolean(
      (currentUser as CurrentUserWithPlatformRole).platformRole,
    );
  }
}
