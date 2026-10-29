import { Category } from '../categories/category.schema';
import { buildSummary } from './build-summary';
import { AggRow } from './summary.types';

const categories: Category[] = [
  {
    categoryId: '01',
    categoryName: 'พลาสติก',
    subCategories: [
      { subCategoryId: '0101', subCategoryName: 'ขวด PET' },
      { subCategoryId: '0102', subCategoryName: 'ขวดใส' },
    ],
  },
  { categoryId: '02', categoryName: 'กระดาษ', subCategories: [{ subCategoryId: '0201', subCategoryName: 'กล่อง' }] },
];

const row = (
  type: 'buy' | 'sell',
  grade: 'A' | 'B' | 'C' | 'D',
  kg: number,
  baht: number,
  price: number,
  orderIds: string[],
  subCategoryId = '0101',
): AggRow => ({
  _id: { categoryId: subCategoryId.slice(0, 2), subCategoryId, type, grade },
  kg,
  baht,
  minPrice: price,
  maxPrice: price,
  orderIds,
});

describe('buildSummary', () => {
  const rows = [
    row('buy', 'A', 100, 3500, 35, ['B1']),
    row('buy', 'B', 50, 1500, 30, ['B1', 'B2']),
    row('sell', 'A', 40, 1600, 40, ['S1']),
  ];
  const { categories: result, total } = buildSummary(rows, categories);
  const sub = result[0].subCategories[0];

  it('รวมจำนวน/ยอดเงินฝั่งซื้อและแยกตามเกรด', () => {
    expect(sub.buy.kg).toBe(150);
    expect(sub.buy.baht).toBe(5000);
    expect(sub.buy.kgByGrade).toEqual({ A: 100, B: 50, C: 0, D: 0 });
  });

  it('ช่วงราคา = ต่ำสุด–สูงสุด และ orderId ไม่ซ้ำ', () => {
    expect([sub.buy.minPrice, sub.buy.maxPrice]).toEqual([30, 35]);
    expect(sub.buy.orderIds).toEqual(['B1', 'B2']);
  });

  it('คงเหลือ = ซื้อ − ขาย', () => {
    expect(sub.remaining).toEqual({ kg: 110, baht: 3400 });
  });

  it('ไม่แสดงหมวด/หมวดย่อยที่ไม่มีข้อมูล', () => {
    expect(result).toHaveLength(1); // หมวด 02 ไม่มีข้อมูล
    expect(result[0].subCategories).toHaveLength(1); // 0102 ไม่มีข้อมูล
  });

  it('ฝั่งที่ไม่มีรายการ → kg 0 และราคา null', () => {
    const onlyBuy = buildSummary([row('buy', 'A', 10, 100, 10, ['B1'])], categories).categories[0];
    expect(onlyBuy.sell).toMatchObject({ kg: 0, baht: 0, minPrice: null, maxPrice: null });
    expect(onlyBuy.remaining).toEqual({ kg: 10, baht: 100 });
  });

  it('ยอดหมวดหมู่และยอดรวมทั้งหมด = ผลรวมของหมวดย่อย', () => {
    const two = buildSummary(
      [row('buy', 'A', 10, 100, 10, ['B1'], '0101'), row('buy', 'A', 5, 70, 14, ['B2'], '0102'), row('buy', 'A', 1, 9, 9, ['B3'], '0201')],
      categories,
    );
    expect(two.categories[0].buy).toMatchObject({ kg: 15, baht: 170, minPrice: 10, maxPrice: 14 });
    expect(two.total.buy.kg).toBe(16);
    expect(total.remaining).toEqual({ kg: 110, baht: 3400 });
  });
});
