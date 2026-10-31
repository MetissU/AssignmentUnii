'use client';

import { CategoryOption, EMPTY_FILTERS, Filters, GRADES, Grade } from '@/lib/types';

interface Props {
  filters: Filters;
  categories: CategoryOption[];
  onChange: (next: Filters) => void; // แก้ค่าในฟอร์ม (ยังไม่ค้นหา)
  onSearch: (filters?: Filters) => void; // กดปุ่มค้นหา (ไม่ส่งค่า = ใช้ค่าในฟอร์มปัจจุบัน)
}

// ฟอร์ม filter: ไม่เรียก API เอง — แค่แก้ค่าใน state ของหน้าหลัก แล้วแจ้งเมื่อกดค้นหา
// จัดเป็น 4 กลุ่ม: ช่วงเวลา / สินค้า / เลขออเดอร์ / ราคาและเกรด
export default function FilterForm({ filters, categories, onChange, onSearch }: Props) {
  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  // หมวดย่อยที่เลือกได้ = เฉพาะของหมวดที่เลือกอยู่ (ถ้ายังไม่เลือกหมวด → ไม่มีให้เลือก)
  const subCategoryOptions = categories.find((category) => category.categoryId === filters.categoryId)?.subCategories ?? [];

  const toggleGrade = (grade: Grade) =>
    setField('grades', filters.grades.includes(grade) ? filters.grades.filter((selected) => selected !== grade) : [...filters.grades, grade]);

  return (
    <form
      className="filters"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      {/* กลุ่ม 1: ช่วงเวลา */}
      <fieldset className="group">
        <legend>ช่วงเวลา</legend>
        <label>
          วันที่เริ่มต้น
          <input type="date" value={filters.dateFrom} onChange={(e) => setField('dateFrom', e.target.value)} />
        </label>
        <label>
          วันที่สิ้นสุด
          <input type="date" value={filters.dateTo} onChange={(e) => setField('dateTo', e.target.value)} />
        </label>
      </fieldset>

      {/* กลุ่ม 2: สินค้า (หมวดหมู่ → หมวดย่อย) */}
      <fieldset className="group">
        <legend>สินค้า</legend>
        <label>
          หมวดหมู่
          {/* เปลี่ยนหมวด → ล้างหมวดย่อยที่เลือกไว้ (กันค่าที่ไม่อยู่ในหมวดใหม่) */}
          <select
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value, subCategoryId: '' })}
          >
            <option value="">ทั้งหมด</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
            ))}
          </select>
        </label>
        <label>
          หมวดหมู่ย่อย
          <select
            value={filters.subCategoryId}
            disabled={!filters.categoryId}
            onChange={(e) => setField('subCategoryId', e.target.value)}
          >
            <option value="">{filters.categoryId ? 'ทั้งหมด' : 'เลือกหมวดหมู่ก่อน'}</option>
            {subCategoryOptions.map((subCategory) => (
              <option key={subCategory.subCategoryId} value={subCategory.subCategoryId}>{subCategory.subCategoryName}</option>
            ))}
          </select>
        </label>
      </fieldset>

      {/* กลุ่ม 3: เลขออเดอร์ */}
      <fieldset className="group">
        <legend>เลขออเดอร์</legend>
        <label>
          เลขออเดอร์
          <input
            type="text"
            placeholder="เช่น UNII2024"
            value={filters.orderId}
            onChange={(e) => setField('orderId', e.target.value)}
          />
        </label>
        <label>
          รูปแบบการค้นหา
          <select value={filters.orderIdMode} onChange={(e) => setField('orderIdMode', e.target.value as Filters['orderIdMode'])}>
            <option value="exact">ตรงทั้งหมด (exact)</option>
            <option value="contains">มีข้อความนี้ (contains)</option>
          </select>
        </label>
      </fieldset>

      {/* กลุ่ม 4: ช่วงราคาและเกรด */}
      <fieldset className="group">
        <legend>ราคาและเกรด</legend>
        <div className="price-pair">
          <label>
            ราคาเริ่มต้น (บาท/กก.)
            <input type="number" min="0" value={filters.priceMin} onChange={(e) => setField('priceMin', e.target.value)} />
          </label>
          <label>
            ราคาสุดท้าย (บาท/กก.)
            <input type="number" min="0" value={filters.priceMax} onChange={(e) => setField('priceMax', e.target.value)} />
          </label>
        </div>
        {/* เกรด: ปุ่มกดเลือก/ยกเลิกได้หลายเกรด (ข้างใต้เป็น checkbox จริง) */}
        <div className="chips" role="group" aria-label="เกรด">
          {GRADES.map((grade) => (
            <label key={grade} className="chip">
              <input type="checkbox" checked={filters.grades.includes(grade)} onChange={() => toggleGrade(grade)} />
              <span>เกรด {grade}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="actions">
        <button type="submit" className="primary">ค้นหา</button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            onChange(EMPTY_FILTERS);
            onSearch(EMPTY_FILTERS); // ส่งค่าว่างไปตรงๆ เพราะ state ยังไม่อัปเดตทัน
          }}
        >
          ล้างตัวกรอง
        </button>
      </div>
    </form>
  );
}
