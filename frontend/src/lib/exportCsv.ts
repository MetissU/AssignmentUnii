import { SummaryResponse } from './types';
import { formatNumber, formatPriceRange } from './format';

/**
 * ส่งออกข้อมูลสรุปเป็นไฟล์ CSV พร้อม UTF-8 BOM เพื่อให้เปิดใน Microsoft Excel ภาษาไทยได้ถูกต้อง
 */
export function exportSummaryToCsv(data: SummaryResponse, filename = 'summary-report.csv') {
  const headers = [
    'ระดับ',
    'หมวดหมู่ / หมวดหมู่ย่อย',
    'ซื้อ: จำนวน (กก.)',
    'ซื้อ: ราคา (บาท/กก.)',
    'ซื้อ: เกรด A (กก.)',
    'ซื้อ: เกรด B (กก.)',
    'ซื้อ: เกรด C (กก.)',
    'ซื้อ: เกรด D (กก.)',
    'ซื้อ: จำนวนออเดอร์',
    'ซื้อ: ยอดรวม (บาท)',
    'ขาย: จำนวน (กก.)',
    'ขาย: ราคา (บาท/กก.)',
    'ขาย: เกรด A (กก.)',
    'ขาย: เกรด B (กก.)',
    'ขาย: เกรด C (กก.)',
    'ขาย: เกรด D (กก.)',
    'ขาย: จำนวนออเดอร์',
    'ขาย: ยอดรวม (บาท)',
    'คงเหลือ: จำนวน (กก.)',
    'คงเหลือ: เงิน (บาท)',
  ];

  const rows: string[][] = [];

  for (const cat of data.categories) {
    // แถวหมวดหมู่หลัก
    rows.push([
      'หมวดหมู่หลัก',
      `"${cat.categoryName.replace(/"/g, '""')}"`,
      String(cat.buy.totalKg),
      `"${formatPriceRange(cat.buy.minPricePerKg, cat.buy.maxPricePerKg)}"`,
      String(cat.buy.kgByGrade.A),
      String(cat.buy.kgByGrade.B),
      String(cat.buy.kgByGrade.C),
      String(cat.buy.kgByGrade.D),
      String(cat.buy.orderIds.length),
      String(cat.buy.totalBaht),
      String(cat.sell.totalKg),
      `"${formatPriceRange(cat.sell.minPricePerKg, cat.sell.maxPricePerKg)}"`,
      String(cat.sell.kgByGrade.A),
      String(cat.sell.kgByGrade.B),
      String(cat.sell.kgByGrade.C),
      String(cat.sell.kgByGrade.D),
      String(cat.sell.orderIds.length),
      String(cat.sell.totalBaht),
      String(cat.remaining.totalKg),
      String(cat.remaining.totalBaht),
    ]);

    // แถวหมวดหมู่ย่อย
    for (const sub of cat.subCategories) {
      rows.push([
        'หมวดหมู่ย่อย',
        `"  ${sub.subCategoryName.replace(/"/g, '""')}"`,
        String(sub.buy.totalKg),
        `"${formatPriceRange(sub.buy.minPricePerKg, sub.buy.maxPricePerKg)}"`,
        String(sub.buy.kgByGrade.A),
        String(sub.buy.kgByGrade.B),
        String(sub.buy.kgByGrade.C),
        String(sub.buy.kgByGrade.D),
        String(sub.buy.orderIds.length),
        String(sub.buy.totalBaht),
        String(sub.sell.totalKg),
        `"${formatPriceRange(sub.sell.minPricePerKg, sub.sell.maxPricePerKg)}"`,
        String(sub.sell.kgByGrade.A),
        String(sub.sell.kgByGrade.B),
        String(sub.sell.kgByGrade.C),
        String(sub.sell.kgByGrade.D),
        String(sub.sell.orderIds.length),
        String(sub.sell.totalBaht),
        String(sub.remaining.totalKg),
        String(sub.remaining.totalBaht),
      ]);
    }
  }

  // แถวรวมทั้งหมด
  rows.push([
    'รวมทั้งหมด',
    '"รวมทั้งสิ้น"',
    String(data.total.buy.totalKg),
    `"${formatPriceRange(data.total.buy.minPricePerKg, data.total.buy.maxPricePerKg)}"`,
    String(data.total.buy.kgByGrade.A),
    String(data.total.buy.kgByGrade.B),
    String(data.total.buy.kgByGrade.C),
    String(data.total.buy.kgByGrade.D),
    String(data.total.buy.orderIds.length),
    String(data.total.buy.totalBaht),
    String(data.total.sell.totalKg),
    `"${formatPriceRange(data.total.sell.minPricePerKg, data.total.sell.maxPricePerKg)}"`,
    String(data.total.sell.kgByGrade.A),
    String(data.total.sell.kgByGrade.B),
    String(data.total.sell.kgByGrade.C),
    String(data.total.sell.kgByGrade.D),
    String(data.total.sell.orderIds.length),
    String(data.total.sell.totalBaht),
    String(data.total.remaining.totalKg),
    String(data.total.remaining.totalBaht),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
