import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/category.schema';
import { TransactionLine } from '../transactions/transaction-line.schema';
import { buildMatch } from './build-match';
import { buildSummary } from './build-summary';
import { SummaryQueryDto } from './summary-query.dto';
import { AggRow, SummaryResponse } from './summary.types';

@Injectable()
export class SummaryService {
  constructor(
    @InjectModel(TransactionLine.name) private readonly lineModel: Model<TransactionLine>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async getSummary(query: SummaryQueryDto): Promise<SummaryResponse> {
    // ขั้นที่ 1: ให้ MongoDB กรองและรวมยอด → ได้ 1 แถวต่อ (หมวดย่อย × ซื้อ/ขาย × เกรด)
    const rows = await this.lineModel.aggregate<AggRow>([
      { $match: buildMatch(query) }, // กรองตาม filter ทั้งหมด
      {
        $group: {
          _id: { categoryId: '$categoryId', subCategoryId: '$subCategoryId', type: '$type', grade: '$grade' },
          kg: { $sum: '$quantityKg' }, // รวมจำนวน (กก.)
          baht: { $sum: '$total' }, // รวมยอดเงิน (บาท)
          minPrice: { $min: '$price' }, // ราคาต่ำสุด
          maxPrice: { $max: '$price' }, // ราคาสูงสุด
          orderIds: { $addToSet: '$orderId' }, // เลขออเดอร์ (ไม่ซ้ำ)
        },
      },
    ]);

    // ขั้นที่ 2: ประกอบเป็นต้นไม้ หมวดหมู่ → หมวดย่อย พร้อมคำนวณคงเหลือ (ทำใน JS เพื่ออ่านง่าย)
    const categories = await this.categoryModel.find().sort({ categoryId: 1 }).lean();
    return buildSummary(rows, categories);
  }
}
