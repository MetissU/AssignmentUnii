import { Category } from '../categories/category.schema';
import { GRADES } from '../transactions/transaction-line.schema';
import { AggRow, CategorySummary, Side, SubCategorySummary, SummaryResponse, SummaryRow } from './summary.types';

// ฟังก์ชันบริสุทธิ์: นำแถวจาก aggregation มาประกอบเป็นต้นไม้ หมวดหมู่ → หมวดย่อย → {ซื้อ, ขาย, คงเหลือ}
// ไม่แตะ DB จึงเขียน unit test ได้ง่าย (ดู build-summary.spec.ts)

const round2 = (n: number) => Math.round(n * 100) / 100;

function emptySide(): Side {
  return { kg: 0, baht: 0, minPrice: null, maxPrice: null, kgByGrade: { A: 0, B: 0, C: 0, D: 0 }, orderIds: [] };
}

/** เอาแถว aggregation 1 แถวไปบวกเข้า Side */
function addRow(side: Side, row: AggRow) {
  side.kg += row.kg;
  side.baht += row.baht;
  side.kgByGrade[row._id.grade] += row.kg;
  side.minPrice = side.minPrice === null ? row.minPrice : Math.min(side.minPrice, row.minPrice);
  side.maxPrice = side.maxPrice === null ? row.maxPrice : Math.max(side.maxPrice, row.maxPrice);
  side.orderIds.push(...row.orderIds);
}

/** รวม Side หลายอัน (ใช้หายอดรวมของหมวดหมู่ และยอดรวมทั้งหมด) */
function mergeSides(sides: Side[]): Side {
  const out = emptySide();
  for (const s of sides) {
    out.kg += s.kg;
    out.baht += s.baht;
    GRADES.forEach((g) => (out.kgByGrade[g] += s.kgByGrade[g]));
    if (s.minPrice !== null) out.minPrice = out.minPrice === null ? s.minPrice : Math.min(out.minPrice, s.minPrice);
    if (s.maxPrice !== null) out.maxPrice = out.maxPrice === null ? s.maxPrice : Math.max(out.maxPrice, s.maxPrice);
    out.orderIds.push(...s.orderIds);
  }
  return out;
}

/** ปัดเศษ + ตัด orderId ซ้ำ + เรียงลำดับ */
function finalizeSide(side: Side): Side {
  return {
    ...side,
    kg: round2(side.kg),
    baht: round2(side.baht),
    kgByGrade: { A: round2(side.kgByGrade.A), B: round2(side.kgByGrade.B), C: round2(side.kgByGrade.C), D: round2(side.kgByGrade.D) },
    orderIds: [...new Set(side.orderIds)].sort(),
  };
}

/** สร้างแถวสรุป: คงเหลือ = ซื้อ − ขาย (ทั้ง กก. และ บาท) */
function toSummaryRow(buyRaw: Side, sellRaw: Side): SummaryRow {
  const buy = finalizeSide(buyRaw);
  const sell = finalizeSide(sellRaw);
  return {
    buy,
    sell,
    remaining: { kg: round2(buy.kg - sell.kg), baht: round2(buy.baht - sell.baht) },
  };
}

export function buildSummary(rows: AggRow[], categories: Category[]): SummaryResponse {
  // 1) จัดกลุ่มแถวตามหมวดย่อย แล้วแยกฝั่งซื้อ/ขาย
  const bySub = new Map<string, { buy: Side; sell: Side }>();
  for (const row of rows) {
    const key = row._id.subCategoryId;
    if (!bySub.has(key)) bySub.set(key, { buy: emptySide(), sell: emptySide() });
    addRow(bySub.get(key)![row._id.type], row);
  }

  // 2) เดินตามลำดับหมวดหมู่ใน DB เพื่อให้เรียงสวย; หมวด/หมวดย่อยที่ไม่มีข้อมูลหลัง filter จะไม่แสดง
  const result: CategorySummary[] = [];
  for (const cat of categories) {
    const subs: SubCategorySummary[] = [];
    const subSides: { buy: Side; sell: Side }[] = [];

    for (const sub of [...cat.subCategories].sort((a, b) => a.subCategoryId.localeCompare(b.subCategoryId))) {
      const sides = bySub.get(sub.subCategoryId);
      if (!sides) continue;
      subSides.push(sides);
      subs.push({ subCategoryId: sub.subCategoryId, subCategoryName: sub.subCategoryName, ...toSummaryRow(sides.buy, sides.sell) });
    }
    if (subs.length === 0) continue;

    result.push({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      subCategories: subs,
      ...toSummaryRow(mergeSides(subSides.map((s) => s.buy)), mergeSides(subSides.map((s) => s.sell))),
    });
  }

  // 3) ยอดรวมทุกหมวด (สรุปท้ายตาราง)
  const total = toSummaryRow(
    mergeSides(result.map((c) => c.buy)),
    mergeSides(result.map((c) => c.sell)),
  );
  return { categories: result, total };
}
