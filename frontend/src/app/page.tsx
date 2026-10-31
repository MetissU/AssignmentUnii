'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import FilterForm from '@/components/FilterForm';
import SkeletonLoader from '@/components/SkeletonLoader';
import SummaryCards from '@/components/SummaryCards';
import SummaryTable from '@/components/SummaryTable';
import { fetchCategories, fetchSummary } from '@/lib/api';
import { CategoryOption, EMPTY_FILTERS, Filters, SummaryResponse } from '@/lib/types';

// หน้าเดียวของระบบ: แถบด้านบน → ฟอร์ม filter → การ์ดยอดรวม → ตารางสรุป → footer
// state ทั้งหมดอยู่ที่นี่ component ลูกรับค่าผ่าน props และแจ้งกลับผ่าน callback
// flow: เปิดหน้า → โหลดรายการหมวดหมู่ + สรุปทั้งหมด → ผู้ใช้แก้ฟอร์ม → กดค้นหา → โหลดสรุปใหม่
export default function Home() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS); // ค่าในฟอร์มตอนนี้
  const [categories, setCategories] = useState<CategoryOption[]>([]); // ข้อมูล dropdown
  const [data, setData] = useState<SummaryResponse | null>(null); // ผลสรุปที่แสดง
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // '' = ไม่มีข้อผิดพลาด
  const [lastUpdated, setLastUpdated] = useState(''); // เวลาที่โหลดผลล่าสุด (แสดงที่แถบด้านบน)

  // โหลดผลสรุปตาม filter ที่ส่งมา
  const search = useCallback(async (searchFilters: Filters) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await fetchSummary(searchFilters);
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ครั้งแรกที่เปิดหน้า
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setError('โหลดรายการหมวดหมู่ไม่สำเร็จ กรุณาตรวจสอบสถานะ Backend'));
    search(EMPTY_FILTERS);
  }, [search]);

  const hasRows = data !== null && data.categories.length > 0;

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="nav-container">
          <div className="brand-group">
            {/* โลโก้บริษัท (ไฟล์อยู่ที่ frontend/public/unii-logo.png) */}
            <Image src="/unii-logo.png" alt="Unii" width={48} height={48} className="brand-logo" priority />
            <div>
              <div className="brand-title-row">
                <span className="brand-name">Unii Digital Group</span>
                <span className="badge-tech">Full-Stack Assignment</span>
              </div>
              <p className="brand-subtitle">ระบบสรุปยอดซื้อ–ขาย และสต็อกสินค้าคงเหลือรายหมวดหมู่</p>
            </div>
          </div>

          <div className="nav-status-group">
            <div className="system-status-indicator">
              <span className="live-pulse"></span>
              <span className="status-text">
                {lastUpdated ? `อัปเดตล่าสุด ${lastUpdated}` : 'ระบบเชื่อมต่อพร้อมใช้งาน'}
              </span>
            </div>

            <button
              type="button"
              className="btn-refresh-data"
              onClick={() => search(filters)}
              disabled={isLoading}
              title="ดึงข้อมูลสรุปใหม่ล่าสุด"
            >
              <svg
                className={isLoading ? 'spin-icon' : ''}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* แผงฟอร์มตัวกรอง 7 รูปแบบ */}
        <FilterForm
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onSearch={(filtersOverride) => search(filtersOverride ?? filters)}
          isLoading={isLoading}
        />

        {/* กรณีเกิดข้อผิดพลาดในการดึงข้อมูล */}
        {error && (
          <div className="error-card" role="alert">
            <div className="error-icon">⚠️</div>
            <div className="error-body">
              <h3>ไม่สามารถเชื่อมต่อข้อมูลได้</h3>
              <p>{error}</p>
              <button
                type="button"
                className="btn-retry"
                onClick={() => search(filters)}
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        )}

        {/* กรณีเปิดหน้าเว็บครั้งแรกและกำลังโหลด */}
        {!error && !data && isLoading && <SkeletonLoader />}

        {/* กรณีไม่มีข้อมูลตามเงื่อนไขที่เลือก (Empty State) */}
        {!error && data && !hasRows && !isLoading && (
          <div className="empty-state-card" role="status">
            <div className="empty-illustration">🔍</div>
            <h3>ไม่พบข้อมูลที่ตรงกับเงื่อนไขตัวกรอง</h3>
            <p>
              ลองปรับลดเงื่อนไข เช่น ขยายช่วงวันที่ เลือกหมวดหมู่ทั้งหมด
              หรือเคลียร์ช่วงราคาและเกรดสินค้า
            </p>
            <button
              type="button"
              className="btn-clear-empty"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                search(EMPTY_FILTERS);
              }}
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

        {/* แสดงผลการ์ดยอดรวม และ ตารางสรุปยอด */}
        {!error && data && hasRows && (
          <div className="dashboard-data-container">
            {/* การ์ดสรุปยอดรวม 3 ใบ + สัดส่วนการขาย */}
            <SummaryCards total={data.total} />

            {/* ตารางสรุปยอด หมวดหมู่ → หมวดหมู่ย่อย */}
            <SummaryTable data={data} isLoading={isLoading} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <Image src="/unii-logo.png" alt="Unii" width={32} height={32} className="footer-logo" />
            <p className="footer-left">
              ระบบสรุปยอดซื้อ–ขายรายสินค้า (NestJS + MongoDB + Next.js App Router)
            </p>
          </div>
          <p className="footer-right">
            ธีมสีตามโจทย์: Primary <code>#4534f0</code> • Secondary <code>#b42996</code>
          </p>
        </div>
      </footer>
    </div>
  );
}
