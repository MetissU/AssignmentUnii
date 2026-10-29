import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [CategoriesModule, TransactionsModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
