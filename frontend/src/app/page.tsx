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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // โหลดผลสรุปตาม filter ที่ส่งมา
  const search = useCallback(async (searchFilters: Filters) => {
    setIsLoading(true);
    setError('');
    try {
      setData(await fetchSummary(searchFilters));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
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
        onSearch={(filtersOverride) => search(filtersOverride ?? filters)}
      />

      {/* ข้อความสถานะ: role=status/alert ให้ screen reader อ่านให้ */}
      {error && <p className="status error" role="alert">{error}</p>}
      {!error && !data && isLoading && <p className="status" role="status">กำลังโหลด...</p>}
      {!error && data && !hasRows && !isLoading && (
        <p className="status" role="status">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
      )}

      {/* มีข้อมูลแล้ว: ระหว่างค้นหาใหม่ยังโชว์ผลเดิมแบบจางไว้ (ไม่ให้หน้ากระโดด) */}
      {!error && data && hasRows && (
        <>
          <SummaryCards total={data.total} />
          <SummaryTable data={data} isLoading={isLoading} />
        </>
      )}
    </main>
  );
}
