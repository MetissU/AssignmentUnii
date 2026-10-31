import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TradeType = 'buy' | 'sell';
export type Grade = 'A' | 'B' | 'C' | 'D';
export const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

// collection: transaction_lines
// 1 document = 1 บรรทัดสินค้าในออเดอร์ (order × subCategory × grade)
// เหตุผลที่ "แตกบรรทัด" (flatten): ทำให้ filter ราคา/เกรด และ $group ทำได้ตรงๆ โดยไม่ต้อง $unwind ซ้อนหลายชั้น
// ความหมายของทุกฟิลด์: docs/data-dictionary.md
@Schema({ collection: 'transaction_lines' })
export class TransactionLine {
  @Prop({ required: true }) orderId: string;
  @Prop({ required: true, enum: ['buy', 'sell'] }) tradeType: TradeType; // ซื้อ หรือ ขาย
  @Prop({ required: true }) categoryId: string;
  @Prop({ required: true }) subCategoryId: string;
  @Prop({ required: true, enum: GRADES }) grade: Grade;
  @Prop({ required: true }) pricePerKg: number; // ราคา บาท/กก.
  @Prop({ required: true }) quantityKg: number; // จำนวน กก. (ต้นทางเป็น string → แปลงเป็นตัวเลขตอน import)
  @Prop({ required: true }) amountBaht: number; // ยอดเงินของบรรทัดนี้ (ใช้ค่า total จากต้นทางตามที่ระบุ)
  @Prop({ required: true }) orderFinishedDate: Date; // เก็บเป็น 00:00 UTC ของวันนั้น
}

export const TransactionLineSchema = SchemaFactory.createForClass(TransactionLine);

// กันข้อมูลซ้ำ: sync กี่ครั้งก็ได้ผลเท่าเดิม (idempotent)
TransactionLineSchema.index({ orderId: 1, tradeType: 1, subCategoryId: 1, grade: 1 }, { unique: true });
// เร่ง filter ที่ใช้บ่อย
TransactionLineSchema.index({ orderFinishedDate: 1 });
TransactionLineSchema.index({ categoryId: 1, subCategoryId: 1 });
