import { FinanceType } from '@prisma/client';

import { FinanceCategoryEntity } from '../types/finance-category.type';

export class FinanceCategoryResponseDto {
  id!: string;
  name!: string;
  type!: FinanceType;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(category: FinanceCategoryEntity) {
    this.id = category.id;
    this.name = category.name;
    this.type = category.type;
    this.active = category.active;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }
}
