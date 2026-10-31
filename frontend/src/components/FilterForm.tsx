'use client';

import { ReactNode, useState } from 'react';
import { CategoryOption, EMPTY_FILTERS, Filters, GRADES, Grade } from '@/lib/types';

interface Props {
  filters: Filters;
  categories: CategoryOption[];
  onChange: (next: Filters) => void; // แก้ค่าในฟอร์ม (ยังไม่ค้นหา)
  onSearch: (filtersOverride?: Filters) => void; // ค้นหา (ไม่ส่งค่า = ใช้ค่าในฟอร์มปัจจุบัน)
  isLoading?: boolean;
}

/** วันที่ตามเวลาเครื่องผู้ใช้ เป็น YYYY-MM-DD (ไม่ใช้ toISOString เพราะเป็นเวลา UTC ทำให้วันเลื่อนในไทยช่วงก่อน 07:00) */
function toLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ป้ายตัวกรองที่ใช้งานอยู่ 1 อัน พร้อมปุ่ม ✕ เอาออก
function FilterTag({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <span className="filter-tag">
      {children}
      <button type="button" onClick={onRemove} aria-label="เอาตัวกรองนี้ออก">
        ✕
      </button>
    </span>
  );
}

// ฟอร์ม filter: ไม่เรียก API เอง — แค่แก้ค่าใน state ของหน้าหลัก แล้วแจ้งเมื่อกดค้นหา
// โครง: หัวแผง (พับ/ขยาย) → ป้ายตัวกรองที่ใช้งาน → ฟอร์ม 4 กลุ่ม → ปุ่มค้นหา/ล้าง
export default function FilterForm({ filters, categories, onChange, onSearch, isLoading = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  // หมวดย่อยที่เลือกได้ = เฉพาะของหมวดที่เลือกอยู่
  const selectedCategory = categories.find((category) => category.categoryId === filters.categoryId);
  const subCategoryOptions = selectedCategory?.subCategories ?? [];
  const selectedSubCategoryName = subCategoryOptions.find(
    (subCategory) => subCategory.subCategoryId === filters.subCategoryId,
  )?.subCategoryName;

  const toggleGrade = (grade: Grade) =>
    setField(
      'grades',
      filters.grades.includes(grade)
        ? filters.grades.filter((selectedGrade) => selectedGrade !== grade)
        : [...filters.grades, grade],
    );

  // ล้างทุกตัวกรองแล้วค้นหาใหม่ (ส่งค่าว่างไปตรงๆ เพราะ state ยังไม่อัปเดตทันในรอบนี้)
  const resetAllFilters = () => {
    onChange(EMPTY_FILTERS);
    onSearch(EMPTY_FILTERS);
  };

  // ปุ่มวันด่วน: ย้อนหลัง N วันจนถึงวันนี้ (null = ล้างช่วงวัน)
  const applyDatePreset = (daysBack: number | null) => {
    if (daysBack === null) {
      onChange({ ...filters, dateFrom: '', dateTo: '' });
      return;
    }
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysBack);
    onChange({ ...filters, dateFrom: toLocalYmd(startDate), dateTo: toLocalYmd(today) });
  };

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const hasPriceFilter = Boolean(filters.priceMin || filters.priceMax);
  const activeFilterCount = [
    hasDateFilter,
    Boolean(filters.categoryId),
    Boolean(filters.subCategoryId),
    Boolean(filters.orderId),
    hasPriceFilter,
    filters.grades.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="filter-panel-card">
      {/* หัวแผง: จำนวนตัวกรองที่ใช้ + ปุ่มพับ/ขยาย */}
      <div className="filter-header">
        <div className="filter-header-left">
          <div className="filter-icon-circle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </div>
          <div>
            <span className="filter-main-title">ตัวกรองข้อมูลค้นหา (Filters)</span>
            <span className="filter-summary-hint">
              {activeFilterCount > 0
                ? `กำลังใช้งาน ${activeFilterCount} เงื่อนไข`
                : 'เลือกเงื่อนไขเพื่อเจาะจงข้อมูลออเดอร์และหมวดสินค้า'}
            </span>
          </div>
        </div>

        <div className="filter-header-right">
          {activeFilterCount > 0 && <span className="active-badge">{activeFilterCount} ตัวกรอง</span>}
          <button
            type="button"
            className="toggle-collapse-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'ย่อตัวกรอง' : 'ขยายตัวกรอง'}
          >
            <svg
              className={`chevron-icon ${isExpanded ? 'open' : ''}`}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span>{isExpanded ? 'ย่อหน้าต่าง' : 'ปรับตัวกรอง'}</span>
          </button>
        </div>
      </div>

      {/* ป้ายตัวกรองที่ใช้งานอยู่ (แสดงค่าในฟอร์ม กด ✕ เพื่อเอาออก แล้วกดค้นหาเพื่อดูผลใหม่) */}
      {activeFilterCount > 0 && (
        <div className="active-filters-bar">
          <span className="active-label">ตัวกรองที่ใช้งาน:</span>
          <div className="active-tags-list">
            {hasDateFilter && (
              <FilterTag onRemove={() => applyDatePreset(null)}>
                📅 {filters.dateFrom || '...'} ถึง {filters.dateTo || '...'}
              </FilterTag>
            )}
            {filters.categoryId && (
              <FilterTag onRemove={() => onChange({ ...filters, categoryId: '', subCategoryId: '' })}>
                📁 หมวด: {selectedCategory?.categoryName ?? filters.categoryId}
              </FilterTag>
            )}
            {filters.subCategoryId && (
              <FilterTag onRemove={() => setField('subCategoryId', '')}>
                📂 ย่อย: {selectedSubCategoryName ?? filters.subCategoryId}
              </FilterTag>
            )}
            {filters.orderId && (
              <FilterTag onRemove={() => setField('orderId', '')}>
                🏷️ ออเดอร์: {filters.orderId} ({filters.orderIdMode})
              </FilterTag>
            )}
            {hasPriceFilter && (
              <FilterTag onRemove={() => onChange({ ...filters, priceMin: '', priceMax: '' })}>
                💰 ราคา: {filters.priceMin || '0'} - {filters.priceMax || '∞'} บ./กก.
              </FilterTag>
            )}
            {filters.grades.length > 0 && (
              <FilterTag onRemove={() => setField('grades', [])}>⭐ เกรด: {filters.grades.join(', ')}</FilterTag>
            )}

            <button type="button" className="clear-all-tag-btn" onClick={resetAllFilters}>
              ล้างทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* ฟอร์มตัวกรอง 4 กลุ่ม */}
      {isExpanded && (
        <form
          className="filters-content"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <div className="filter-grid">
            {/* กลุ่ม 1: ช่วงเวลา */}
            <fieldset className="filter-group">
              <legend>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>1. ช่วงเวลาวันที่</span>
              </legend>

              <div className="date-preset-row">
                <button type="button" className="preset-pill" onClick={() => applyDatePreset(0)}>
                  วันนี้
                </button>
                <button type="button" className="preset-pill" onClick={() => applyDatePreset(7)}>
                  7 วัน
                </button>
                <button type="button" className="preset-pill" onClick={() => applyDatePreset(30)}>
                  30 วัน
                </button>
                {hasDateFilter && (
                  <button type="button" className="preset-pill clear" onClick={() => applyDatePreset(null)}>
                    ล้างวัน
                  </button>
                )}
              </div>

              <div className="two-cols">
                <label>
                  <span className="field-label">วันที่เริ่มต้น</span>
                  <input type="date" value={filters.dateFrom} onChange={(event) => setField('dateFrom', event.target.value)} />
                </label>
                <label>
                  <span className="field-label">วันที่สิ้นสุด</span>
                  <input type="date" value={filters.dateTo} onChange={(event) => setField('dateTo', event.target.value)} />
                </label>
              </div>
            </fieldset>

            {/* กลุ่ม 2: หมวดหมู่สินค้า (เปลี่ยนหมวด → ล้างหมวดย่อย) */}
            <fieldset className="filter-group">
              <legend>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>2. หมวดหมู่สินค้า</span>
              </legend>

              <label>
                <span className="field-label">หมวดหมู่หลัก</span>
                <select
                  value={filters.categoryId}
                  onChange={(event) => onChange({ ...filters, categoryId: event.target.value, subCategoryId: '' })}
                >
                  <option value="">ทั้งหมด ({categories.length} หมวด)</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.categoryName} ({category.categoryId})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label">
                  หมวดหมู่ย่อย {filters.categoryId && `(${subCategoryOptions.length} รายการ)`}
                </span>
                <select
                  value={filters.subCategoryId}
                  disabled={!filters.categoryId}
                  onChange={(event) => setField('subCategoryId', event.target.value)}
                >
                  <option value="">{filters.categoryId ? 'ทั้งหมดในหมวดนี้' : '← เลือกหมวดหมู่หลักก่อน'}</option>
                  {subCategoryOptions.map((subCategory) => (
                    <option key={subCategory.subCategoryId} value={subCategory.subCategoryId}>
                      {subCategory.subCategoryName} ({subCategory.subCategoryId})
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            {/* กลุ่ม 3: เลขออเดอร์ */}
            <fieldset className="filter-group">
              <legend>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" y1="9" x2="20" y2="9"></line>
                  <line x1="4" y1="15" x2="20" y2="15"></line>
                  <line x1="10" y1="3" x2="8" y2="21"></line>
                  <line x1="16" y1="3" x2="14" y2="21"></line>
                </svg>
                <span>3. เลขที่ออเดอร์</span>
              </legend>

              <label>
                <span className="field-label">เลขออเดอร์</span>
                <div className="input-with-clear">
                  <input
                    type="text"
                    placeholder="เช่น UNII2024 หรือ CUNII"
                    value={filters.orderId}
                    onChange={(event) => setField('orderId', event.target.value)}
                  />
                  {filters.orderId && (
                    <button type="button" className="inline-clear" onClick={() => setField('orderId', '')} aria-label="ล้างเลขออเดอร์">
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <label>
                <span className="field-label">รูปแบบการจับคู่</span>
                <select
                  value={filters.orderIdMode}
                  onChange={(event) => setField('orderIdMode', event.target.value as Filters['orderIdMode'])}
                >
                  <option value="exact">ตรงเป๊ะทั้งหมด (Exact Match)</option>
                  <option value="contains">มีข้อความนี้ (Contains Match)</option>
                </select>
              </label>
            </fieldset>

            {/* กลุ่ม 4: ช่วงราคา + เกรด */}
            <fieldset className="filter-group">
              <legend>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>4. ช่วงราคา & เกรดสินค้า</span>
              </legend>

              <div className="two-cols">
                <label>
                  <span className="field-label">ราคาต่ำสุด (บาท/กก.)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.priceMin}
                    onChange={(event) => setField('priceMin', event.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">ราคาสูงสุด (บาท/กก.)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="ไม่จำกัด"
                    value={filters.priceMax}
                    onChange={(event) => setField('priceMax', event.target.value)}
                  />
                </label>
              </div>

              <div>
                <div className="grade-header-row">
                  <span className="field-label">เลือกเกรดสินค้า</span>
                  <div className="grade-shortcuts">
                    <button type="button" onClick={() => setField('grades', [...GRADES])}>
                      ทั้งหมด
                    </button>
                    <span>•</span>
                    <button type="button" onClick={() => setField('grades', [])}>
                      ล้าง
                    </button>
                  </div>
                </div>

                {/* ปุ่มเกรด: ข้างใต้เป็น checkbox จริง จึงใช้คีย์บอร์ด/screen reader ได้ */}
                <div className="grade-chips" role="group" aria-label="เกรดสินค้า">
                  {GRADES.map((grade) => {
                    const isSelected = filters.grades.includes(grade);
                    return (
                      <label key={grade} className={`grade-chip ${isSelected ? 'active' : ''}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleGrade(grade)} />
                        <span className="chip-indicator"></span>
                        <span className="chip-text">เกรด {grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          </div>

          {/* ปุ่มค้นหา / ล้างค่า */}
          <div className="filter-actions-bar">
            <div className="actions-left">
              <span className="actions-tip">
                💡 คำแนะนำ: ตัวกรองทั้งหมดทำงานร่วมกันแบบ <strong>AND</strong>
              </span>
            </div>

            <div className="actions-right">
              <button type="button" className="btn-reset" onClick={resetAllFilters}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                <span>ล้างตัวกรอง</span>
              </button>

              <button type="submit" className="btn-search" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span>ค้นหาและสรุปยอด</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
