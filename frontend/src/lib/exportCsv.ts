import { formatPriceRange } from './format';
import { GRADES, SideTotals, SummaryResponse, SummaryRow } from './types';

// ส่งออกตารางสรุปเป็นไฟล์ CSV (1 แถว CSV = 1 แถวในตาราง: หมวด → หมวดย่อย → รวมทั้งหมด)
// ใส่ UTF-8 BOM นำหน้า เพื่อให้ Microsoft Excel เปิดภาษาไทยได้ถูกต้อง

/** ครอบข้อความด้วย " และ escape " ภายใน ตามมาตรฐาน CSV */
const quoteCsv = (text: string) => `"${text.replace(/"/g, '""')}"`;

/** หัวคอลัมน์ของ 1 ฝั่ง เช่น "ซื้อ: จำนวน (กก.)" */
function sideHeaders(sideLabel: string): string[] {
  return [
    `${sideLabel}: จำนวน (กก.)`,
    `${sideLabel}: ราคา (บาท/กก.)`,
    ...GRADES.map((grade) => `${sideLabel}: เกรด ${grade} (กก.)`),
    `${sideLabel}: จำนวนออเดอร์`,
    `${sideLabel}: ยอดรวม (บาท)`,
  ];
}

/** ค่าของ 1 ฝั่ง เรียงตรงกับ sideHeaders */
function sideValues(side: SideTotals): string[] {
  return [
    String(side.totalKg),
    quoteCsv(formatPriceRange(side.minPricePerKg, side.maxPricePerKg)),
    ...GRADES.map((grade) => String(side.kgByGrade[grade])),
    String(side.orderIds.length),
    String(side.totalBaht),
  ];
}

/** 1 แถว CSV: ระดับ | ชื่อ | ซื้อ | ขาย | คงเหลือ */
function csvRow(level: string, name: string, row: SummaryRow): string[] {
  return [
    level,
    quoteCsv(name),
    ...sideValues(row.buy),
    ...sideValues(row.sell),
    String(row.remaining.totalKg),
    String(row.remaining.totalBaht),
  ];
}

export function exportSummaryToCsv(data: SummaryResponse, filename = 'summary-report.csv') {
  const headers = [
    'ระดับ',
    'หมวดหมู่ / หมวดหมู่ย่อย',
    ...sideHeaders('ซื้อ'),
    ...sideHeaders('ขาย'),
    'คงเหลือ: จำนวน (กก.)',
    'คงเหลือ: เงิน (บาท)',
  ];

  const rows: string[][] = [];
  for (const category of data.categories) {
    rows.push(csvRow('หมวดหมู่หลัก', category.categoryName, category));
    for (const subCategory of category.subCategories) {
      rows.push(csvRow('หมวดหมู่ย่อย', `  ${subCategory.subCategoryName}`, subCategory));
    }
  }
  rows.push(csvRow('รวมทั้งหมด', 'รวมทั้งสิ้น', data.total));

  // สร้างไฟล์ในเบราว์เซอร์แล้วสั่งดาวน์โหลดผ่านลิงก์ชั่วคราว
  const csvContent = '﻿' + [headers, ...rows].map((columns) => columns.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
