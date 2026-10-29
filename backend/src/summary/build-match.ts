import { SummaryQueryDto } from './summary-query.dto';

// แปลง filter จากหน้าเว็บ → เงื่อนไข $match ของ MongoDB
// ทุก filter ใช้ AND กัน และ filter ทำงานที่ระดับ "บรรทัดสินค้า" จึงทำให้ยอดสรุปสอดคล้องกับเกรด/ราคาที่เลือกโดยอัตโนมัติ
export function buildMatch(q: SummaryQueryDto): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  // ช่วงวัน (รวมวันเริ่มและวันสิ้นสุด) — วันที่เก็บเป็น 00:00 UTC จึงเทียบวันเดียวกันได้ตรง
  if (q.dateFrom || q.dateTo) {
    const range: Record<string, Date> = {};
    if (q.dateFrom) range.$gte = new Date(`${q.dateFrom}T00:00:00.000Z`);
    if (q.dateTo) range.$lte = new Date(`${q.dateTo}T00:00:00.000Z`);
    match.orderFinishedDate = range;
  }

  if (q.categoryId) match.categoryId = q.categoryId;
  if (q.subCategoryId) match.subCategoryId = q.subCategoryId;

  // เลขออเดอร์: exact = เท่ากับ, contains = regex (escape อักขระพิเศษกัน regex injection)
  if (q.orderId) {
    match.orderId =
      q.orderIdMode === 'contains' ? { $regex: escapeRegex(q.orderId), $options: 'i' } : q.orderId;
  }

  // ช่วงราคา (บาท/กก.)
  if (q.priceMin !== undefined || q.priceMax !== undefined) {
    const range: Record<string, number> = {};
    if (q.priceMin !== undefined) range.$gte = q.priceMin;
    if (q.priceMax !== undefined) range.$lte = q.priceMax;
    match.price = range;
  }

  if (q.grade?.length) match.grade = { $in: q.grade };

  return match;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
