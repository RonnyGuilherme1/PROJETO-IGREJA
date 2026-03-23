import { FinanceTransactionStatus, FinanceType } from '@prisma/client';

import { FinanceTransactionEntity } from '../types/finance-transaction.type';

export class FinanceTransactionResponseDto {
  id!: string;
  churchId!: string;
  categoryId!: string;
  type!: FinanceType;
  description!: string;
  amount!: string;
  transactionDate!: Date;
  notes!: string | null;
  status!: FinanceTransactionStatus;
  createdByUserId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(transaction: FinanceTransactionEntity) {
    this.id = transaction.id;
    this.churchId = transaction.churchId;
    this.categoryId = transaction.categoryId;
    this.type = transaction.type;
    this.description = transaction.description;
    this.amount = transaction.amount.toString();
    this.transactionDate = transaction.transactionDate;
    this.notes = transaction.notes;
    this.status = transaction.status;
    this.createdByUserId = transaction.createdByUserId;
    this.createdAt = transaction.createdAt;
    this.updatedAt = transaction.updatedAt;
  }
}
