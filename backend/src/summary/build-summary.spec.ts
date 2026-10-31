import { Category } from '../categories/category.schema';
import { buildSummary } from './build-summary';
import { GroupedLineRow } from './summary.types';

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

// สร้างแถวผล $group จำลอง (ราคาต่ำสุด = สูงสุด = pricePerKg)
const groupedRow = (
  tradeType: 'buy' | 'sell',
  grade: 'A' | 'B' | 'C' | 'D',
  totalKg: number,
  totalBaht: number,
  pricePerKg: number,
  orderIds: string[],
  subCategoryId = '0101',
): GroupedLineRow => ({
  _id: { categoryId: subCategoryId.slice(0, 2), subCategoryId, tradeType, grade },
  totalKg,
  totalBaht,
  minPricePerKg: pricePerKg,
  maxPricePerKg: pricePerKg,
  orderIds,
});

describe('buildSummary', () => {
  const groupedRows = [
    groupedRow('buy', 'A', 100, 3500, 35, ['B1']),
    groupedRow('buy', 'B', 50, 1500, 30, ['B1', 'B2']),
    groupedRow('sell', 'A', 40, 1600, 40, ['S1']),
  ];
  const { categories: categorySummaries, total } = buildSummary(groupedRows, categories);
  const firstSubCategory = categorySummaries[0].subCategories[0];

  it('รวมจำนวน/ยอดเงินฝั่งซื้อและแยกตามเกรด', () => {
    expect(firstSubCategory.buy.totalKg).toBe(150);
    expect(firstSubCategory.buy.totalBaht).toBe(5000);
    expect(firstSubCategory.buy.kgByGrade).toEqual({ A: 100, B: 50, C: 0, D: 0 });
  });

  it('ช่วงราคา = ต่ำสุด–สูงสุด และ orderId ไม่ซ้ำ', () => {
    expect([firstSubCategory.buy.minPricePerKg, firstSubCategory.buy.maxPricePerKg]).toEqual([30, 35]);
    expect(firstSubCategory.buy.orderIds).toEqual(['B1', 'B2']);
  });

  it('คงเหลือ = ซื้อ − ขาย', () => {
    expect(firstSubCategory.remaining).toEqual({ totalKg: 110, totalBaht: 3400 });
  });

  it('ไม่แสดงหมวด/หมวดย่อยที่ไม่มีข้อมูล', () => {
    expect(categorySummaries).toHaveLength(1); // หมวด 02 ไม่มีข้อมูล
    expect(categorySummaries[0].subCategories).toHaveLength(1); // 0102 ไม่มีข้อมูล
  });

  it('ฝั่งที่ไม่มีรายการ → จำนวน 0 และราคา null', () => {
    const buyOnly = buildSummary([groupedRow('buy', 'A', 10, 100, 10, ['B1'])], categories).categories[0];
    expect(buyOnly.sell).toMatchObject({ totalKg: 0, totalBaht: 0, minPricePerKg: null, maxPricePerKg: null });
    expect(buyOnly.remaining).toEqual({ totalKg: 10, totalBaht: 100 });
  });

  it('ยอดหมวดหมู่และยอดรวมทั้งหมด = ผลรวมของหมวดย่อย', () => {
    const twoCategories = buildSummary(
      [
        groupedRow('buy', 'A', 10, 100, 10, ['B1'], '0101'),
        groupedRow('buy', 'A', 5, 70, 14, ['B2'], '0102'),
        groupedRow('buy', 'A', 1, 9, 9, ['B3'], '0201'),
      ],
      categories,
    );
    expect(twoCategories.categories[0].buy).toMatchObject({
      totalKg: 15,
      totalBaht: 170,
      minPricePerKg: 10,
      maxPricePerKg: 14,
    });
    expect(twoCategories.total.buy.totalKg).toBe(16);
    expect(total.remaining).toEqual({ totalKg: 110, totalBaht: 3400 });
  });
});
