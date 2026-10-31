import { normalizeCategories, normalizeOrders } from './normalize';
import { RawOrder } from './source-types';

describe('normalizeCategories', () => {
  it('เปลี่ยน subcategory → subCategories', () => {
    const result = normalizeCategories({
      productList: [
        { categoryId: '01', categoryName: 'พลาสติก', subcategory: [{ subCategoryId: '0101', subCategoryName: 'ขวด' }] },
      ],
    });
    expect(result).toEqual([
      { categoryId: '01', categoryName: 'พลาสติก', subCategories: [{ subCategoryId: '0101', subCategoryName: 'ขวด' }] },
    ]);
  });
});

describe('normalizeOrders', () => {
  const order: RawOrder = {
    orderId: 'UNII1',
    orderFinishedDate: '2024-04-09',
    requestList: [
      {
        categoryID: '01',
        subCategoryID: '0101',
        requestList: [
          { grade: 'A', price: 35, quantity: '34', total: 1190 },
          { grade: 'B', price: 0, quantity: '0', total: 0 }, // ไม่มีของ → ต้องถูกข้าม
          { grade: 'C', price: 30, quantity: '2.5', total: 75 }, // ทศนิยมได้
        ],
      },
    ],
  };

  it('แตกบรรทัดและข้ามเกรดที่ quantity = 0', () => {
    const lines = normalizeOrders([order], 'buy');
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.grade)).toEqual(['A', 'C']);
  });

  it('แปลง quantity เป็นตัวเลข, ใส่ tradeType และใช้ total ตามต้นทางเป็น amountBaht', () => {
    const [gradeALine, gradeCLine] = normalizeOrders([order], 'sell');
    expect(gradeALine).toMatchObject({
      tradeType: 'sell',
      pricePerKg: 35,
      quantityKg: 34,
      amountBaht: 1190,
      categoryId: '01',
      subCategoryId: '0101',
    });
    expect(gradeCLine.quantityKg).toBe(2.5);
  });

  it('แปลงวันที่เป็น 00:00 UTC', () => {
    const [firstLine] = normalizeOrders([order], 'buy');
    expect(firstLine.orderFinishedDate.toISOString()).toBe('2024-04-09T00:00:00.000Z');
  });
});
