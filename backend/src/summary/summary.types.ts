import { Grade, TradeType } from '../transactions/transaction-line.schema';

// ความหมายของทุกฟิลด์: docs/data-dictionary.md หัวข้อ "Response ของ GET /summary"

// แถวผลลัพธ์จาก MongoDB $group (1 แถว = หมวดย่อย × ซื้อ/ขาย × เกรด)
export interface GroupedLineRow {
  _id: { categoryId: string; subCategoryId: string; tradeType: TradeType; grade: Grade };
  totalKg: number;
  totalBaht: number;
  minPricePerKg: number;
  maxPricePerKg: number;
  orderIds: string[];
}

// ยอดรวมของฝั่งซื้อ หรือฝั่งขาย 1 ฝั่ง
export interface SideTotals {
  totalKg: number; // จำนวนรวม (กก.)
  totalBaht: number; // ยอดเงินรวม (บาท)
  minPricePerKg: number | null; // ราคาต่ำสุด บาท/กก. (null = ไม่มีรายการ)
  maxPricePerKg: number | null; // ราคาสูงสุด บาท/กก.
  kgByGrade: Record<Grade, number>; // จำนวน กก. แยกเกรด
  orderIds: string[]; // เลขออเดอร์ที่เกี่ยวข้อง (ไม่ซ้ำ)
}

// คงเหลือ = ซื้อ − ขาย
export interface RemainingTotals {
  totalKg: number;
  totalBaht: number;
}

// 1 แถวในตาราง: ซื้อ + ขาย + คงเหลือ
export interface SummaryRow {
  buy: SideTotals;
  sell: SideTotals;
  remaining: RemainingTotals;
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
