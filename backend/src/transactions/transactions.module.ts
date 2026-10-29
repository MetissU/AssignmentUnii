import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionLine, TransactionLineSchema } from './transaction-line.schema';

// module นี้ทำหน้าที่เดียว: ลงทะเบียน model TransactionLine ให้ module อื่นนำไปใช้
@Module({
  imports: [MongooseModule.forFeature([{ name: TransactionLine.name, schema: TransactionLineSchema }])],
  exports: [MongooseModule],
})
export class TransactionsModule {}
