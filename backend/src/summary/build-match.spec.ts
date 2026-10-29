import { buildMatch } from './build-match';

describe('buildMatch', () => {
  it('ไม่มี filter → match ทั้งหมด', () => {
    expect(buildMatch({})).toEqual({});
  });

  it('ช่วงวันรวมวันเริ่ม/สิ้นสุด', () => {
    expect(buildMatch({ dateFrom: '2024-04-01', dateTo: '2024-04-30' })).toEqual({
      orderFinishedDate: { $gte: new Date('2024-04-01T00:00:00.000Z'), $lte: new Date('2024-04-30T00:00:00.000Z') },
    });
  });

  it('orderId exact (ค่าเริ่มต้น) และ contains', () => {
    expect(buildMatch({ orderId: 'UNII1' })).toEqual({ orderId: 'UNII1' });
    expect(buildMatch({ orderId: 'UNII1', orderIdMode: 'contains' })).toEqual({
      orderId: { $regex: 'UNII1', $options: 'i' },
    });
  });

  it('escape อักขระพิเศษของ regex', () => {
    const m = buildMatch({ orderId: 'a.b', orderIdMode: 'contains' }) as { orderId: { $regex: string } };
    expect(m.orderId.$regex).toBe('a\\.b');
  });

  it('ช่วงราคาและเกรด', () => {
    expect(buildMatch({ priceMin: 10, grade: ['A', 'B'] })).toEqual({
      price: { $gte: 10 },
      grade: { $in: ['A', 'B'] },
    });
  });

  it('priceMin = 0 ยังต้องถูกนำไปใช้', () => {
    expect(buildMatch({ priceMin: 0 })).toEqual({ price: { $gte: 0 } });
  });
});
