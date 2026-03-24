import { Module } from '@nestjs/common';

import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { TenantFinanceCategoriesController } from './tenant-finance-categories.controller';
import { TenantFinanceTransactionsController } from './tenant-finance-transactions.controller';

@Module({
  controllers: [
    FinanceController,
    TenantFinanceTransactionsController,
    TenantFinanceCategoriesController,
  ],
  providers: [FinanceService],
})
export class FinanceModule {}
