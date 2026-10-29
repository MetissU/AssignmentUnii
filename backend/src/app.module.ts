import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from './categories/categories.module';
import { SummaryModule } from './summary/summary.module';
import { SyncModule } from './sync/sync.module';
import { TransactionsModule } from './transactions/transactions.module';

// ประกอบทุก module เข้าด้วยกัน + เชื่อมต่อ MongoDB (ตั้งค่าผ่าน env MONGO_URI)
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/unii'),
    CategoriesModule, // GET /categories
    TransactionsModule, // schema ของ transaction_lines
    SyncModule, // POST /sync
    SummaryModule, // GET /summary
  ],
})
export class AppModule {}
