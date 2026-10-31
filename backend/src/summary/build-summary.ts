import { Category } from '../categories/category.schema';
import { GRADES } from '../transactions/transaction-line.schema';
import {
  CategorySummary,
  GroupedLineRow,
  SideTotals,
  SubCategorySummary,
  SummaryResponse,
  SummaryRow,
} from './summary.types';

// ฟังก์ชันบริสุทธิ์: นำแถวจาก aggregation มาประกอบเป็นต้นไม้ หมวดหมู่ → หมวดย่อย → {ซื้อ, ขาย, คงเหลือ}
// ไม่แตะ DB จึงเขียน unit test ได้ง่าย (ดู build-summary.spec.ts)

const roundTo2Decimals = (value: number) => Math.round(value * 100) / 100;

function createEmptySideTotals(): SideTotals {
  return {
    totalKg: 0,
    totalBaht: 0,
    minPricePerKg: null,
    maxPricePerKg: null,
    kgByGrade: { A: 0, B: 0, C: 0, D: 0 },
    orderIds: [],
  };
}

// ราคาต่ำสุด/สูงสุดที่รองรับค่า null (null = ยังไม่มีรายการ)
const lowerPrice = (current: number | null, next: number) => (current === null ? next : Math.min(current, next));
const higherPrice = (current: number | null, next: number) => (current === null ? next : Math.max(current, next));

/** เอาแถว aggregation 1 แถวไปบวกเข้ายอดรวมของฝั่งนั้น */
function addGroupedRowToSide(side: SideTotals, row: GroupedLineRow) {
  side.totalKg += row.totalKg;
  side.totalBaht += row.totalBaht;
  side.kgByGrade[row._id.grade] += row.totalKg;
  side.minPricePerKg = lowerPrice(side.minPricePerKg, row.minPricePerKg);
  side.maxPricePerKg = higherPrice(side.maxPricePerKg, row.maxPricePerKg);
  side.orderIds.push(...row.orderIds);
}

/** รวมยอดหลายฝั่งเข้าด้วยกัน (ใช้หายอดของหมวดหมู่ และยอดรวมทั้งหมด) */
function sumSideTotals(sides: SideTotals[]): SideTotals {
  const combined = createEmptySideTotals();
  for (const side of sides) {
    combined.totalKg += side.totalKg;
    combined.totalBaht += side.totalBaht;
    GRADES.forEach((grade) => (combined.kgByGrade[grade] += side.kgByGrade[grade]));
    if (side.minPricePerKg !== null) combined.minPricePerKg = lowerPrice(combined.minPricePerKg, side.minPricePerKg);
    if (side.maxPricePerKg !== null) combined.maxPricePerKg = higherPrice(combined.maxPricePerKg, side.maxPricePerKg);
    combined.orderIds.push(...side.orderIds);
  }
  return combined;
}

/** ปัดเศษ + ตัด orderId ซ้ำ + เรียงลำดับ ก่อนส่งออก */
function finalizeSideTotals(side: SideTotals): SideTotals {
  return {
    ...side,
    totalKg: roundTo2Decimals(side.totalKg),
    totalBaht: roundTo2Decimals(side.totalBaht),
    kgByGrade: {
      A: roundTo2Decimals(side.kgByGrade.A),
      B: roundTo2Decimals(side.kgByGrade.B),
      C: roundTo2Decimals(side.kgByGrade.C),
      D: roundTo2Decimals(side.kgByGrade.D),
    },
    orderIds: [...new Set(side.orderIds)].sort(),
  };
}

/** สร้างแถวสรุป: คงเหลือ = ซื้อ − ขาย (ทั้ง กก. และ บาท) */
function buildSummaryRow(buyTotals: SideTotals, sellTotals: SideTotals): SummaryRow {
  const buy = finalizeSideTotals(buyTotals);
  const sell = finalizeSideTotals(sellTotals);
  return {
    buy,
    sell,
    remaining: {
      totalKg: roundTo2Decimals(buy.totalKg - sell.totalKg),
      totalBaht: roundTo2Decimals(buy.totalBaht - sell.totalBaht),
    },
  };
}

export function buildSummary(groupedRows: GroupedLineRow[], categories: Category[]): SummaryResponse {
  // 1) จัดกลุ่มแถวตามหมวดย่อย แล้วแยกฝั่งซื้อ/ขาย
  const sidesBySubCategoryId = new Map<string, { buy: SideTotals; sell: SideTotals }>();
  for (const row of groupedRows) {
    const subCategoryId = row._id.subCategoryId;
    if (!sidesBySubCategoryId.has(subCategoryId)) {
      sidesBySubCategoryId.set(subCategoryId, { buy: createEmptySideTotals(), sell: createEmptySideTotals() });
    }
    addGroupedRowToSide(sidesBySubCategoryId.get(subCategoryId)![row._id.tradeType], row);
  }

  // 2) เดินตามลำดับหมวดหมู่ใน DB เพื่อให้เรียงสวย; หมวด/หมวดย่อยที่ไม่มีข้อมูลหลัง filter จะไม่แสดง
  const categorySummaries: CategorySummary[] = [];
  for (const category of categories) {
    const subCategorySummaries: SubCategorySummary[] = [];
    const subCategorySides: { buy: SideTotals; sell: SideTotals }[] = [];

    const sortedSubCategories = [...category.subCategories].sort((a, b) => a.subCategoryId.localeCompare(b.subCategoryId));
    for (const subCategory of sortedSubCategories) {
      const sides = sidesBySubCategoryId.get(subCategory.subCategoryId);
      if (!sides) continue;
      subCategorySides.push(sides);
      subCategorySummaries.push({
        subCategoryId: subCategory.subCategoryId,
        subCategoryName: subCategory.subCategoryName,
        ...buildSummaryRow(sides.buy, sides.sell),
      });
    }
    if (subCategorySummaries.length === 0) continue;

    categorySummaries.push({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      subCategories: subCategorySummaries,
      ...buildSummaryRow(
        sumSideTotals(subCategorySides.map((sides) => sides.buy)),
        sumSideTotals(subCategorySides.map((sides) => sides.sell)),
      ),
    });
  }

  // 3) ยอดรวมทุกหมวด (สรุปท้ายตาราง)
  const total = buildSummaryRow(
    sumSideTotals(categorySummaries.map((summary) => summary.buy)),
    sumSideTotals(categorySummaries.map((summary) => summary.sell)),
  );
  return { categories: categorySummaries, total };
}
