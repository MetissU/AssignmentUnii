import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

@Module({
  imports: [CategoriesModule, TransactionsModule],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
