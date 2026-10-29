'use client';

import { useCallback, useEffect, useState } from 'react';
import FilterForm from '@/components/FilterForm';
import SummaryCards from '@/components/SummaryCards';
import SummaryTable from '@/components/SummaryTable';
import { fetchCategories, fetchSummary } from '@/lib/api';
import { CategoryOption, EMPTY_FILTERS, Filters, SummaryResponse } from '@/lib/types';

// หน้าเดียวของระบบ: ฟอร์ม filter + การ์ดยอดรวม + ตารางสรุป
// flow: เปิดหน้า → โหลดรายการหมวดหมู่ + สรุปทั้งหมด → ผู้ใช้แก้ฟอร์ม → กดค้นหา → โหลดสรุปใหม่
export default function Home() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS); // ค่าในฟอร์มตอนนี้
  const [categories, setCategories] = useState<CategoryOption[]>([]); // ข้อมูล dropdown
  const [data, setData] = useState<SummaryResponse | null>(null); // ผลสรุปที่แสดง
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // โหลดผลสรุปตาม filter ที่ส่งมา
  const search = useCallback(async (f: Filters) => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchSummary(f));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, []);

  // ครั้งแรกที่เปิดหน้า
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setError('โหลดรายการหมวดหมู่ไม่สำเร็จ'));
    search(EMPTY_FILTERS);
  }, [search]);

  const hasRows = data !== null && data.categories.length > 0;

  return (
    <main>
      <h1>สรุปยอดซื้อ–ขายรายสินค้า</h1>
      <p className="subtitle">สรุปตามหมวดหมู่และหมวดหมู่ย่อย พร้อมยอดคงเหลือ (ซื้อ − ขาย)</p>

      <FilterForm
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onSearch={(override) => search(override ?? filters)}
      />

      {/* ข้อความสถานะ: role=status/alert ให้ screen reader อ่านให้ */}
      {error && <p className="status error" role="alert">{error}</p>}
      {!error && !data && loading && <p className="status" role="status">กำลังโหลด...</p>}
      {!error && data && !hasRows && !loading && (
        <p className="status" role="status">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
      )}

      {/* มีข้อมูลแล้ว: ระหว่างค้นหาใหม่ยังโชว์ผลเดิมแบบจางไว้ (ไม่ให้หน้ากระโดด) */}
      {!error && data && hasRows && (
        <>
          <SummaryCards total={data.total} />
          <SummaryTable data={data} loading={loading} />
        </>
      )}
    </main>
  );
}
