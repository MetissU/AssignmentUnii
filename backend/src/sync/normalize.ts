import { Category } from '../categories/category.schema';
import { GRADES, Grade, TransactionLine, TransactionType } from '../transactions/transaction-line.schema';
import { RawCategoryResponse, RawOrder } from './source-types';

// ฟังก์ชันบริสุทธิ์ (ไม่แตะ DB / network) แปลงข้อมูลดิบจากต้นทาง → รูปแบบที่เก็บใน MongoDB
// แยกไฟล์ไว้เพื่อให้เขียน unit test ได้ง่าย

/** แปลงหมวดหมู่: เปลี่ยนชื่อ field `subcategory` (ต้นทาง) → `subCategories` (ของเรา) */
export function normalizeCategories(raw: RawCategoryResponse): Category[] {
  return raw.productList.map((c) => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    subCategories: c.subcategory.map((s) => ({
      subCategoryId: s.subCategoryId,
      subCategoryName: s.subCategoryName,
    })),
  }));
}

/** แปลงออเดอร์ 1 ชุด (ซื้อหรือขาย) → รายการ transaction_lines แบบแตกบรรทัด */
export function normalizeOrders(orders: RawOrder[], type: TransactionType): TransactionLine[] {
  const lines: TransactionLine[] = [];

  for (const order of orders) {
    // "2024-04-09" → Date เที่ยงคืน UTC (ไม่ให้ timezone ทำให้วันเพี้ยน)
    const orderFinishedDate = new Date(`${order.orderFinishedDate}T00:00:00.000Z`);

    for (const item of order.requestList) {
      for (const g of item.requestList) {
        const quantityKg = Number(g.quantity); // ต้นทางเป็น string
        if (!(quantityKg > 0)) continue; // เกรดที่ไม่มีของ (0 / "") ไม่ต้องเก็บ
        if (!GRADES.includes(g.grade as Grade)) continue; // กันเกรดแปลกปลอม

        lines.push({
          orderId: order.orderId,
          type,
          categoryId: item.categoryID,
          subCategoryId: item.subCategoryID,
          grade: g.grade as Grade,
          price: g.price,
          quantityKg,
          total: g.total, // ใช้ total ตามต้นทาง (ไม่คำนวณ price × kg ใหม่)
          orderFinishedDate,
        });
      }
    }
  }
  return lines;
}
