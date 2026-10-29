// ชนิดข้อมูลที่ตรงกับ response ของ backend (ดู backend/src/summary/summary.types.ts)

export type Grade = 'A' | 'B' | 'C' | 'D';
export const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

export interface Side {
  kg: number;
  baht: number;
  minPrice: number | null;
  maxPrice: number | null;
  kgByGrade: Record<Grade, number>;
  orderIds: string[];
}

export interface SummaryRow {
  buy: Side;
  sell: Side;
  remaining: { kg: number; baht: number };
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

export interface SummaryResponse {
  categories: CategorySummary[];
  total: SummaryRow;
}

// ข้อมูลสำหรับ dropdown (GET /categories)
export interface CategoryOption {
  categoryId: string;
  categoryName: string;
  subCategories: { subCategoryId: string; subCategoryName: string }[];
}

// ค่าในฟอร์ม filter (เก็บเป็น string เพราะมาจาก <input> ค่าว่าง = ไม่กรอง)
export interface Filters {
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  subCategoryId: string;
  orderId: string;
  orderIdMode: 'exact' | 'contains';
  priceMin: string;
  priceMax: string;
  grades: Grade[];
}

export const EMPTY_FILTERS: Filters = {
  dateFrom: '',
  dateTo: '',
  categoryId: '',
  subCategoryId: '',
  orderId: '',
  orderIdMode: 'exact',
  priceMin: '',
  priceMax: '',
  grades: [],
};
