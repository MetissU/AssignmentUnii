'use client';

import { useState } from 'react';
import { formatNumber, formatPriceRange } from '@/lib/format';
import { exportSummaryToCsv } from '@/lib/exportCsv';
import { CategorySummary, GRADES, SideTotals, SummaryResponse, SummaryRow } from '@/lib/types';
import OrderIdsModal from './OrderIdsModal';

interface Props {
  data: SummaryResponse;
  isLoading: boolean;
}

// เซลล์ตัวเลข: ชิดขวา, ค่า 0 จางลง, ค่าติดลบเด่นชัด
function NumberCell({ value, isRemainingMoney = false }: { value: number; isRemainingMoney?: boolean }) {
  if (value === 0) {
    return <td className="cell-num cell-zero">0</td>;
  }
  if (value < 0) {
    return (
      <td className="cell-num cell-negative">
        <span className="neg-badge">{formatNumber(value)}</span>
      </td>
    );
  }
  return (
    <td className={`cell-num ${isRemainingMoney ? 'cell-profit' : ''}`}>
      {formatNumber(value)}
    </td>
  );
}

// คอลัมน์ 8 ช่องของ 1 ฝั่ง (ซื้อ หรือ ขาย)
function SideCells({
  side,
  type,
  itemTitle,
  onOpenOrderModal,
}: {
  side: SideTotals;
  type: 'buy' | 'sell';
  itemTitle: string;
  onOpenOrderModal: (title: string, orderIds: string[], type: 'buy' | 'sell') => void;
}) {
  return (
    <>
      <NumberCell value={side.totalKg} />
      <td className="cell-num cell-price">
        {formatPriceRange(side.minPricePerKg, side.maxPricePerKg)}
      </td>
      {GRADES.map((grade) => (
        <NumberCell key={grade} value={side.kgByGrade[grade]} />
      ))}
      <td className="cell-center cell-orders">
        {side.orderIds.length === 0 ? (
          <span className="empty-dash">-</span>
        ) : (
          <button
            type="button"
            className={`order-tag-btn ${type}`}
            onClick={() => onOpenOrderModal(itemTitle, side.orderIds, type)}
            title="คลิกเพื่อดูและคัดลอกเลขออเดอร์ทั้งหมด"
          >
            <span className="order-icon">🏷️</span>
            <span>{side.orderIds.length}</span>
          </button>
        )}
      </td>
      <NumberCell value={side.totalBaht} />
    </>
  );
}

// 1 แถวของข้อมูล: ชื่อ | ซื้อ (8) | ขาย (8) | คงเหลือ (2)
function SummaryTableRow({
  name,
  row,
  className,
  isCategory = false,
  isExpanded = true,
  onToggleExpand,
  subCount = 0,
  onOpenOrderModal,
}: {
  name: string;
  row: SummaryRow;
  className?: string;
  isCategory?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  subCount?: number;
  onOpenOrderModal: (title: string, orderIds: string[], type: 'buy' | 'sell') => void;
}) {
  return (
    <tr className={`${className || ''} ${isCategory ? 'row-category' : 'row-subcategory'}`}>
      <th scope="row" className="cell-name-sticky">
        <div className="name-wrapper">
          {isCategory && onToggleExpand ? (
            <button
              type="button"
              className="expand-chevron-btn"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'พับหมวดหมู่' : 'ขยายหมวดหมู่'}
            >
              <svg
                className={`chevron-svg ${isExpanded ? 'rotated' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          ) : (
            <span className="sub-indent-dot">•</span>
          )}

          <span className="item-name" title={name}>
            {name}
          </span>

          {isCategory && subCount > 0 && (
            <span className="sub-count-tag">{subCount} รายการ</span>
          )}
        </div>
      </th>

      {/* ฝั่งซื้อ 8 คอลัมน์ */}
      <SideCells side={row.buy} type="buy" itemTitle={name} onOpenOrderModal={onOpenOrderModal} />

      {/* ฝั่งขาย 8 คอลัมน์ */}
      <SideCells side={row.sell} type="sell" itemTitle={name} onOpenOrderModal={onOpenOrderModal} />

      {/* ฝั่งคงเหลือ 2 คอลัมน์ */}
      <NumberCell value={row.remaining.totalKg} />
      <NumberCell value={row.remaining.totalBaht} isRemainingMoney />
    </tr>
  );
}

// หัวคอลัมน์ของ 1 ฝั่ง (ซื้อ / ขาย)
function SideHeaderCells({ type }: { type: 'buy' | 'sell' }) {
  return (
    <>
      <th className={`sub-th ${type}`}>จำนวน (กก.)</th>
      <th className={`sub-th ${type}`}>ราคา (บ./กก.)</th>
      {GRADES.map((grade) => (
        <th key={grade} className={`sub-th ${type} th-grade`}>
          เกรด {grade}
        </th>
      ))}
      <th className={`sub-th ${type} th-orders`}>เลขออเดอร์</th>
      <th className={`sub-th ${type}`}>ยอดรวม (บาท)</th>
    </>
  );
}

export default function SummaryTable({ data, isLoading }: Props) {
  // ควบคุมการพับ/ขยายของแต่ละหมวดหมู่ (เริ่มต้นให้ขยายทั้งหมด)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  // สถานะ Modal สำหรับดูเลขออเดอร์
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    subTitle: string;
    orderIds: string[];
    type: 'buy' | 'sell';
  }>({
    isOpen: false,
    title: '',
    subTitle: '',
    orderIds: [],
    type: 'buy',
  });

  // ค้นหาข้อความแบบเรียลไทม์ในตาราง
  const [tableSearch, setTableSearch] = useState('');

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const expandAll = () => setCollapsedCategories({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    data.categories.forEach((c) => {
      allCollapsed[c.categoryId] = true;
    });
    setCollapsedCategories(allCollapsed);
  };

  const openOrderModal = (title: string, orderIds: string[], type: 'buy' | 'sell') => {
    setModalState({
      isOpen: true,
      title,
      subTitle: `รายการเลขออเดอร์ฝั่ง${type === 'buy' ? 'ซื้อ' : 'ขาย'}ทั้งหมด`,
      orderIds,
      type,
    });
  };

  const totalSubCategoriesCount = data.categories.reduce(
    (acc, curr) => acc + curr.subCategories.length,
    0
  );

  // กรองหมวดหมู่/หมวดย่อยตาม tableSearch ถ้ามีการกรอก
  const filteredCategories = data.categories.map((cat) => {
    if (!tableSearch.trim()) return cat;
    const term = tableSearch.toLowerCase();
    const isCatMatch = cat.categoryName.toLowerCase().includes(term);
    const matchedSubs = cat.subCategories.filter((sub) =>
      sub.subCategoryName.toLowerCase().includes(term)
    );
    return {
      ...cat,
      subCategories: isCatMatch ? cat.subCategories : matchedSubs,
      isMatch: isCatMatch || matchedSubs.length > 0,
    };
  }).filter((cat) => !tableSearch.trim() || (cat as any).isMatch);

  return (
    <div className="table-section-container">
      {/* แถบควบคุมตาราง (Toolbar) */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="table-stat-badge">
            <span className="dot-active"></span>
            <span>
              แสดง <strong>{filteredCategories.length}</strong> หมวดหมู่ (
              <strong>{totalSubCategoriesCount}</strong> หมวดหมู่ย่อย)
            </span>
          </div>

          <div className="table-quick-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้าในตาราง..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            {tableSearch && (
              <button type="button" className="clear-quick-search" onClick={() => setTableSearch('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-right">
          <div className="accordion-toggle-group">
            <button type="button" className="tool-btn" onClick={expandAll} title="ขยายทุกหมวดหมู่">
              ขยายทั้งหมด
            </button>
            <span className="tool-divider">|</span>
            <button type="button" className="tool-btn" onClick={collapseAll} title="พับเก็บทุกหมวดหมู่">
              พับทั้งหมด
            </button>
          </div>

          <button
            type="button"
            className="tool-btn-export"
            onClick={() => exportSummaryToCsv(data)}
            title="ดาวน์โหลดตารางสรุปนี้เป็นไฟล์ CSV"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* กรอบตารางแบบ Responsive Scroll พร้อม Sticky Headers */}
      <div className={`table-scroll-viewport ${isLoading ? 'dimmed' : ''}`} aria-busy={isLoading}>
        <table className="master-summary-table">
          <caption className="sr-only">
            ตารางสรุปยอดซื้อ ขาย และคงเหลือ แยกตามหมวดหมู่และหมวดหมู่ย่อย
          </caption>

          {/* หัวตาราง 2 แถว */}
          <thead>
            {/* แถวที่ 1: กลุ่มหลัก */}
            <tr className="header-group-row">
              <th rowSpan={2} className="th-sticky-first">
                <div className="first-header-box">
                  <span className="primary-title">หมวดหมู่ / หมวดหมู่ย่อย</span>
                  <span className="secondary-subtitle">ลำดับชั้นสินค้า</span>
                </div>
              </th>

              <th colSpan={8} className="th-group th-buy-group">
                <div className="group-header-content">
                  <span className="group-dot buy"></span>
                  <span className="group-name">ฝั่งซื้อ (Inbound Transactions)</span>
                </div>
              </th>

              <th colSpan={8} className="th-group th-sell-group">
                <div className="group-header-content">
                  <span className="group-dot sell"></span>
                  <span className="group-name">ฝั่งขาย (Outbound Transactions)</span>
                </div>
              </th>

              <th colSpan={2} className="th-group th-remain-group">
                <div className="group-header-content">
                  <span className="group-dot remain"></span>
                  <span className="group-name">คงเหลือสุทธิ (ซื้อ − ขาย)</span>
                </div>
              </th>
            </tr>

            {/* แถวที่ 2: คอลัมน์ย่อย */}
            <tr className="header-sub-row">
              <SideHeaderCells type="buy" />
              <SideHeaderCells type="sell" />
              <th className="sub-th remain">กก. คงเหลือ</th>
              <th className="sub-th remain">เงินคงเหลือ (บ.)</th>
            </tr>
          </thead>

          {/* เนื้อหาตาราง */}
          <tbody>
            {filteredCategories.map((category) => {
              const isCollapsed = Boolean(collapsedCategories[category.categoryId]);
              return (
                <tbody key={category.categoryId} className="category-tbody-group">
                  {/* แถวระดับหมวดหมู่หลัก */}
                  <SummaryTableRow
                    name={category.categoryName}
                    row={category}
                    isCategory
                    isExpanded={!isCollapsed}
                    onToggleExpand={() => toggleCategory(category.categoryId)}
                    subCount={category.subCategories.length}
                    onOpenOrderModal={openOrderModal}
                  />

                  {/* แถวระดับหมวดหมู่ย่อย (จะแสดงถ้าหมวดหลักยังไม่ถูกพับ) */}
                  {!isCollapsed &&
                    category.subCategories.map((subCategory) => (
                      <SummaryTableRow
                        key={subCategory.subCategoryId}
                        name={subCategory.subCategoryName}
                        row={subCategory}
                        onOpenOrderModal={openOrderModal}
                      />
                    ))}
                </tbody>
              );
            })}
          </tbody>

          {/* แถวรวมทั้งหมดท้ายตาราง (Sticky Bottom) */}
          <tfoot>
            <tr className="row-total-footer">
              <th scope="row" className="cell-name-sticky total-sticky">
                <div className="total-name-box">
                  <span className="total-badge">GRAND TOTAL</span>
                  <span className="total-label">รวมทั้งหมดทุกหมวด</span>
                </div>
              </th>

              <SideCells
                side={data.total.buy}
                type="buy"
                itemTitle="รวมทั้งหมด (ฝั่งซื้อ)"
                onOpenOrderModal={openOrderModal}
              />

              <SideCells
                side={data.total.sell}
                type="sell"
                itemTitle="รวมทั้งหมด (ฝั่งขาย)"
                onOpenOrderModal={openOrderModal}
              />

              <NumberCell value={data.total.remaining.totalKg} />
              <NumberCell value={data.total.remaining.totalBaht} isRemainingMoney />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal หน้าต่างดูเลขออเดอร์ทั้งหมด */}
      <OrderIdsModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        subTitle={modalState.subTitle}
        orderIds={modalState.orderIds}
        type={modalState.type}
      />
    </div>
  );
}
