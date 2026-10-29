import { Grade, TransactionType } from '../transactions/transaction-line.schema';

// แถวผลลัพธ์จาก MongoDB aggregation (1 แถว = หมวดย่อย × ซื้อ/ขาย × เกรด)
export interface AggRow {
  _id: { categoryId: string; subCategoryId: string; type: TransactionType; grade: Grade };
  kg: number;
  baht: number;
  minPrice: number;
  maxPrice: number;
  orderIds: string[];
}

// ข้อมูลฝั่งซื้อ หรือฝั่งขาย 1 ฝั่ง
export interface Side {
  kg: number; // จำนวนรวม (กก.)
  baht: number; // ยอดรวม (บาท)
  minPrice: number | null; // ราคาต่ำสุดต่อ กก. (null = ไม่มีรายการ)
  maxPrice: number | null; // ราคาสูงสุดต่อ กก.
  kgByGrade: Record<Grade, number>; // จำนวนแยกเกรด
  orderIds: string[]; // ออเดอร์ที่เกี่ยวข้อง
}

// 1 แถวในตาราง: ซื้อ + ขาย + คงเหลือ
export interface SummaryRow {
  buy: Side;
  sell: Side;
  remaining: { kg: number; baht: number }; // = ซื้อ − ขาย
}

export interface SubCategorySummary extends SummaryRow {
  subCategoryId: string;
  subCategoryName: string;
}

export interface CategorySummary extends SummaryRow {
  categoryId: string;
  categoryName: string;
  subCategories: SubCategorySummary[];
}

// ผลลัพธ์ทั้งหมดของ GET /summary
export interface SummaryResponse {
  categories: CategorySummary[];
  total: SummaryRow; // ยอดรวมทุกหมวด
}
