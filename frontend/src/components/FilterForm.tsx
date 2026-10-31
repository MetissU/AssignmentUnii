'use client';

import { useState } from 'react';
import { CategoryOption, EMPTY_FILTERS, Filters, GRADES, Grade } from '@/lib/types';

interface Props {
  filters: Filters;
  categories: CategoryOption[];
  onChange: (next: Filters) => void;
  onSearch: (filters?: Filters) => void;
  isLoading?: boolean;
}

export default function FilterForm({ filters, categories, onChange, onSearch, isLoading = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const setField = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  // หมวดย่อยที่เลือกได้ = เฉพาะของหมวดที่เลือกอยู่
  const subCategoryOptions =
    categories.find((c) => c.categoryId === filters.categoryId)?.subCategories ?? [];

  const toggleGrade = (grade: Grade) => {
    const nextGrades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    setField('grades', nextGrades);
  };

  const selectAllGrades = () => setField('grades', [...GRADES]);
  const clearGrades = () => setField('grades', []);

  // นับจำนวนตัวกรองที่กำลังใช้งานอยู่
  const activeFiltersCount = [
    Boolean(filters.dateFrom || filters.dateTo),
    Boolean(filters.categoryId),
    Boolean(filters.subCategoryId),
    Boolean(filters.orderId),
    Boolean(filters.priceMin || filters.priceMax),
    filters.grades.length > 0,
  ].filter(Boolean).length;

  // ฟังก์ชันตั้งค่าวันด่วน (Date Presets)
  const applyDatePreset = (daysAgo: number | null) => {
    if (daysAgo === null) {
      onChange({ ...filters, dateFrom: '', dateTo: '' });
      return;
    }
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - daysAgo);

    const formatYmd = (d: Date) => d.toISOString().split('T')[0];
    onChange({
      ...filters,
      dateFrom: formatYmd(from),
      dateTo: formatYmd(today),
    });
  };

  // ชื่อหมวดหมู่ที่เลือก (สำหรับป้ายตัวกรอง)
  const selectedCategoryName = categories.find((c) => c.categoryId === filters.categoryId)?.categoryName;
  const selectedSubCategoryName = subCategoryOptions.find((s) => s.subCategoryId === filters.subCategoryId)?.subCategoryName;

  return (
    <div className="filter-panel-card">
      {/* ส่วนหัวของแผงตัวกรอง */}
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="filter-header-left">
          <div className="filter-icon-circle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </div>
          <div>
            <span className="filter-main-title">ตัวกรองข้อมูลค้นหา (Filters)</span>
            <span className="filter-summary-hint">
              {activeFiltersCount > 0
                ? `กำลังใช้งาน ${activeFiltersCount} เงื่อนไข`
                : 'เลือกเงื่อนไขเพื่อเจาะจงข้อมูลออเดอร์และหมวดสินค้า'}
            </span>
          </div>
        </div>

        <div className="filter-header-right">
          {activeFiltersCount > 0 && (
            <span className="active-badge">{activeFiltersCount} ตัวกรอง</span>
          )}
          <button
            type="button"
            className="toggle-collapse-btn"
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

      {/* แถบ Active Filter Tags (เมื่อมีตัวกรองถูกเลือก) */}
      {activeFiltersCount > 0 && (
        <div className="active-filters-bar">
          <span className="active-label">ตัวกรองที่ใช้งาน:</span>
          <div className="active-tags-list">
            {(filters.dateFrom || filters.dateTo) && (
              <span className="filter-tag">
                📅 {filters.dateFrom || '...'} ถึง {filters.dateTo || '...'}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...filters, dateFrom: '', dateTo: '' });
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {filters.categoryId && (
              <span className="filter-tag">
                📁 หมวด: {selectedCategoryName || filters.categoryId}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...filters, categoryId: '', subCategoryId: '' });
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {filters.subCategoryId && (
              <span className="filter-tag">
                📂 ย่อย: {selectedSubCategoryName || filters.subCategoryId}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setField('subCategoryId', '');
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {filters.orderId && (
              <span className="filter-tag">
                🏷️ ออเดอร์: {filters.orderId} ({filters.orderIdMode})
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setField('orderId', '');
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {(filters.priceMin || filters.priceMax) && (
              <span className="filter-tag">
                💰 ราคา: {filters.priceMin || '0'} - {filters.priceMax || '∞'} บ./กก.
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...filters, priceMin: '', priceMax: '' });
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {filters.grades.length > 0 && (
              <span className="filter-tag">
                ⭐ เกรด: {filters.grades.join(', ')}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setField('grades', []);
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              className="clear-all-tag-btn"
              onClick={() => {
                onChange(EMPTY_FILTERS);
                onSearch(EMPTY_FILTERS);
              }}
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* ฟอร์มตัวกรอง 4 กลุ่ม */}
      {isExpanded && (
        <form
          className="filters-content"
          onSubmit={(e) => {
            e.preventDefault();
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
                {(filters.dateFrom || filters.dateTo) && (
                  <button type="button" className="preset-pill clear" onClick={() => applyDatePreset(null)}>
                    ล้างวัน
                  </button>
                )}
              </div>

              <div className="two-cols">
                <label>
                  <span className="field-label">วันที่เริ่มต้น</span>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setField('dateFrom', e.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">วันที่สิ้นสุด</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setField('dateTo', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            {/* กลุ่ม 2: หมวดหมู่สินค้า */}
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
                  onChange={(e) => onChange({ ...filters, categoryId: e.target.value, subCategoryId: '' })}
                >
                  <option value="">ทั้งหมด ({categories.length} หมวด)</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName} ({c.categoryId})
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
                  onChange={(e) => setField('subCategoryId', e.target.value)}
                >
                  <option value="">{filters.categoryId ? 'ทั้งหมดในหมวดนี้' : '← เลือกหมวดหมู่หลักก่อน'}</option>
                  {subCategoryOptions.map((s) => (
                    <option key={s.subCategoryId} value={s.subCategoryId}>
                      {s.subCategoryName} ({s.subCategoryId})
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
                    onChange={(e) => setField('orderId', e.target.value)}
                  />
                  {filters.orderId && (
                    <button type="button" className="inline-clear" onClick={() => setField('orderId', '')}>
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <label>
                <span className="field-label">รูปแบบการจับคู่</span>
                <select
                  value={filters.orderIdMode}
                  onChange={(e) => setField('orderIdMode', e.target.value as Filters['orderIdMode'])}
                >
                  <option value="exact">ตรงเป๊ะทั้งหมด (Exact Match)</option>
                  <option value="contains">มีข้อความนี้ (Contains Match)</option>
                </select>
              </label>
            </fieldset>

            {/* กลุ่ม 4: ราคา & เกรด */}
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
                    onChange={(e) => setField('priceMin', e.target.value)}
                  />
                </label>
                <label>
                  <span className="field-label">ราคาสูงสุด (บาท/กก.)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="ไม่จำกัด"
                    value={filters.priceMax}
                    onChange={(e) => setField('priceMax', e.target.value)}
                  />
                </label>
              </div>

              <div>
                <div className="grade-header-row">
                  <span className="field-label">เลือกเกรดสินค้า</span>
                  <div className="grade-shortcuts">
                    <button type="button" onClick={selectAllGrades}>
                      ทั้งหมด
                    </button>
                    <span>•</span>
                    <button type="button" onClick={clearGrades}>
                      ล้าง
                    </button>
                  </div>
                </div>

                <div className="grade-chips" role="group" aria-label="เกรดสินค้า">
                  {GRADES.map((grade) => {
                    const isSelected = filters.grades.includes(grade);
                    return (
                      <label key={grade} className={`grade-chip ${isSelected ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGrade(grade)}
                        />
                        <span className="chip-indicator"></span>
                        <span className="chip-text">เกรด {grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          </div>

          {/* แถบปุ่ม Action ค้นหา และ ล้างค่า */}
          <div className="filter-actions-bar">
            <div className="actions-left">
              <span className="actions-tip">
                💡 คำแนะนำ: ตัวกรองทั้งหมดทำงานร่วมกันแบบ <strong>AND</strong>
              </span>
            </div>

            <div className="actions-right">
              <button
                type="button"
                className="btn-reset"
                onClick={() => {
                  onChange(EMPTY_FILTERS);
                  onSearch(EMPTY_FILTERS);
                }}
              >
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
