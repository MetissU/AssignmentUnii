import { SummaryQueryDto } from './summary-query.dto';

// แปลง filter จากหน้าเว็บ → เงื่อนไข $match ของ MongoDB
// ทุก filter ใช้ AND กัน และ filter ทำงานที่ระดับ "บรรทัดสินค้า" จึงทำให้ยอดสรุปสอดคล้องกับเกรด/ราคาที่เลือกโดยอัตโนมัติ
export function buildMatch(query: SummaryQueryDto): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  // ช่วงวัน (รวมวันเริ่มและวันสิ้นสุด) — วันที่เก็บเป็น 00:00 UTC จึงเทียบวันเดียวกันได้ตรง
  if (query.dateFrom || query.dateTo) {
    const dateRange: Record<string, Date> = {};
    if (query.dateFrom) dateRange.$gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    if (query.dateTo) dateRange.$lte = new Date(`${query.dateTo}T00:00:00.000Z`);
    match.orderFinishedDate = dateRange;
  }

  if (query.categoryId) match.categoryId = query.categoryId;
  if (query.subCategoryId) match.subCategoryId = query.subCategoryId;

  // เลขออเดอร์: exact = เท่ากับ, contains = regex (escape อักขระพิเศษกัน regex injection)
  if (query.orderId) {
    match.orderId =
      query.orderIdMode === 'contains' ? { $regex: escapeRegex(query.orderId), $options: 'i' } : query.orderId;
  }

  // ช่วงราคา (บาท/กก.) — เช็ก !== undefined เพื่อให้ priceMin = 0 ยังถูกใช้
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    const priceRange: Record<string, number> = {};
    if (query.priceMin !== undefined) priceRange.$gte = query.priceMin;
    if (query.priceMax !== undefined) priceRange.$lte = query.priceMax;
    match.pricePerKg = priceRange;
  }

  if (query.grade?.length) match.grade = { $in: query.grade };

  return match;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
