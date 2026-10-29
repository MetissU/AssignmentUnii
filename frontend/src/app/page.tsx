'use client';

import { useCallback, useEffect, useState } from 'react';
import FilterForm from '@/components/FilterForm';
import SummaryTable from '@/components/SummaryTable';
import { fetchCategories, fetchSummary } from '@/lib/api';
import { CategoryOption, EMPTY_FILTERS, Filters, SummaryResponse } from '@/lib/types';

// หน้าเดียวของระบบ: ฟอร์ม filter + ตารางสรุป
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

  return (
    <main>
      <h1>สรุปยอดซื้อ–ขายรายสินค้า</h1>

      <FilterForm
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onSearch={(override) => search(override ?? filters)}
      />

      {loading && <p className="status">กำลังโหลด...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && data && data.categories.length === 0 && (
        <p className="status">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
      )}
      {!loading && !error && data && data.categories.length > 0 && <SummaryTable data={data} />}
    </main>
  );
}
