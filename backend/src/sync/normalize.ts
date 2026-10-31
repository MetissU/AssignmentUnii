import { Category } from '../categories/category.schema';
import { GRADES, Grade, TradeType, TransactionLine } from '../transactions/transaction-line.schema';
import { RawCategoryResponse, RawOrder } from './source-types';

// ฟังก์ชันบริสุทธิ์ (ไม่แตะ DB / network) แปลงข้อมูลดิบจากต้นทาง → รูปแบบที่เก็บใน MongoDB
// แยกไฟล์ไว้เพื่อให้เขียน unit test ได้ง่าย
// ฟิลด์ต้นทาง → ฟิลด์ของเรา: docs/data-dictionary.md หัวข้อ "การแปลงข้อมูล"

/** แปลงหมวดหมู่: เปลี่ยนชื่อ field `subcategory` (ต้นทาง) → `subCategories` (ของเรา) */
export function normalizeCategories(rawResponse: RawCategoryResponse): Category[] {
  return rawResponse.productList.map((rawCategory) => ({
    categoryId: rawCategory.categoryId,
    categoryName: rawCategory.categoryName,
    subCategories: rawCategory.subcategory.map((rawSubCategory) => ({
      subCategoryId: rawSubCategory.subCategoryId,
      subCategoryName: rawSubCategory.subCategoryName,
    })),
  }));
}

/** แปลงออเดอร์ 1 ชุด (ซื้อหรือขาย) → รายการ transaction_lines แบบแตกบรรทัด */
export function normalizeOrders(orders: RawOrder[], tradeType: TradeType): TransactionLine[] {
  const lines: TransactionLine[] = [];

  for (const order of orders) {
    // "2024-04-09" → Date เที่ยงคืน UTC (ไม่ให้ timezone ทำให้วันเพี้ยน)
    const orderFinishedDate = new Date(`${order.orderFinishedDate}T00:00:00.000Z`);

    for (const subCategoryItem of order.requestList) {
      for (const gradeItem of subCategoryItem.requestList) {
        const quantityKg = Number(gradeItem.quantity); // ต้นทางเป็น string
        if (!(quantityKg > 0)) continue; // เกรดที่ไม่มีของ (0 / "") ไม่ต้องเก็บ
        if (!GRADES.includes(gradeItem.grade as Grade)) continue; // กันเกรดแปลกปลอม

        lines.push({
          orderId: order.orderId,
          tradeType,
          categoryId: subCategoryItem.categoryID,
          subCategoryId: subCategoryItem.subCategoryID,
          grade: gradeItem.grade as Grade,
          pricePerKg: gradeItem.price,
          quantityKg,
          amountBaht: gradeItem.total, // ใช้ total ตามต้นทาง (ไม่คำนวณ ราคา × กก. ใหม่)
          orderFinishedDate,
        });
      }
    }
  }
  return lines;
}
