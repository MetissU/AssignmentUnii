'use client';

import { useCallback, useState } from 'react';
import { exportSummaryToCsv } from '@/lib/exportCsv';
import { formatNumber, formatPriceRange } from '@/lib/format';
import { CategorySummary, GRADES, SideTotals, SummaryResponse, SummaryRow, TradeType } from '@/lib/types';
import OrderIdsModal from './OrderIdsModal';

interface Props {
  data: SummaryResponse;
  isLoading: boolean; // กำลังโหลดผลใหม่ → ตารางเดิมจางลงแต่ไม่หายไป
}

// ข้อมูลของหน้าต่างเลขออเดอร์ที่เปิดอยู่ (null = ปิด)
interface OpenOrderList {
  title: string;
  orderIds: string[];
  tradeType: TradeType;
}

type OpenOrderListHandler = (title: string, orderIds: string[], tradeType: TradeType) => void;

// ---------- เซลล์ย่อย ----------

// เซลล์ตัวเลข: ชิดขวา, ค่า 0 จางลง, ค่าติดลบเด่นชัด
function NumberCell({ value, isRemainingMoney = false }: { value: number; isRemainingMoney?: boolean }) {
  if (value === 0) return <td className="cell-num cell-zero">0</td>;
  if (value < 0) {
    return (
      <td className="cell-num cell-negative">
        <span className="neg-badge">{formatNumber(value)}</span>
      </td>
    );
  }
  return <td className={`cell-num ${isRemainingMoney ? 'cell-profit' : ''}`}>{formatNumber(value)}</td>;
}

// 8 คอลัมน์ของ 1 ฝั่ง (ซื้อ หรือ ขาย)
function SideCells({
  side,
  tradeType,
  rowTitle,
  onOpenOrderList,
}: {
  side: SideTotals;
  tradeType: TradeType;
  rowTitle: string;
  onOpenOrderList: OpenOrderListHandler;
}) {
  return (
    <>
      <NumberCell value={side.totalKg} />
      <td className="cell-num cell-price">{formatPriceRange(side.minPricePerKg, side.maxPricePerKg)}</td>
      {GRADES.map((grade) => (
        <NumberCell key={grade} value={side.kgByGrade[grade]} />
      ))}
      <td className="cell-center cell-orders">
        {side.orderIds.length === 0 ? (
          <span className="empty-dash">-</span>
        ) : (
          <button
            type="button"
            className={`order-tag-btn ${tradeType}`}
            onClick={() => onOpenOrderList(rowTitle, side.orderIds, tradeType)}
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
// แถวหมวดหมู่มีปุ่มพับ/ขยาย ส่วนแถวหมวดย่อยมีจุดนำหน้า
function SummaryTableRow({
  name,
  row,
  onOpenOrderList,
  category,
}: {
  name: string;
  row: SummaryRow;
  onOpenOrderList: OpenOrderListHandler;
  category?: { isExpanded: boolean; onToggle: () => void; subCategoryCount: number }; // มีเฉพาะแถวหมวดหมู่
}) {
  return (
    <tr className={category ? 'row-category' : 'row-subcategory'}>
      <th scope="row" className="cell-name-sticky">
        <div className="name-wrapper">
          {category ? (
            <button
              type="button"
              className="expand-chevron-btn"
              onClick={category.onToggle}
              aria-label={category.isExpanded ? 'พับหมวดหมู่' : 'ขยายหมวดหมู่'}
              aria-expanded={category.isExpanded}
            >
              <svg
                className={`chevron-svg ${category.isExpanded ? 'rotated' : ''}`}
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

          {category && category.subCategoryCount > 0 && (
            <span className="sub-count-tag">{category.subCategoryCount} รายการ</span>
          )}
        </div>
      </th>

      <SideCells side={row.buy} tradeType="buy" rowTitle={name} onOpenOrderList={onOpenOrderList} />
      <SideCells side={row.sell} tradeType="sell" rowTitle={name} onOpenOrderList={onOpenOrderList} />

      <NumberCell value={row.remaining.totalKg} />
      <NumberCell value={row.remaining.totalBaht} isRemainingMoney />
    </tr>
  );
}

// หัวคอลัมน์ของ 1 ฝั่ง (ซื้อ / ขาย ใช้ชุดเดียวกัน)
function SideHeaderCells({ tradeType }: { tradeType: TradeType }) {
  return (
    <>
      <th className={`sub-th ${tradeType}`}>จำนวน (กก.)</th>
      <th className={`sub-th ${tradeType}`}>ราคา (บ./กก.)</th>
      {GRADES.map((grade) => (
        <th key={grade} className={`sub-th ${tradeType} th-grade`}>
          เกรด {grade}
        </th>
      ))}
      <th className={`sub-th ${tradeType} th-orders`}>เลขออเดอร์</th>
      <th className={`sub-th ${tradeType}`}>ยอดรวม (บาท)</th>
    </>
  );
}

// ค้นหาชื่อในตาราง: หมวดที่ชื่อตรง → แสดงทุกหมวดย่อย, ไม่ตรง → แสดงเฉพาะหมวดย่อยที่ชื่อตรง
// (ตัวเลขของแถวหมวดหมู่ยังเป็นยอดทั้งหมวดเสมอ เพราะคำนวณมาจาก API)
function filterCategoriesByName(categories: CategorySummary[], searchText: string): CategorySummary[] {
  const term = searchText.trim().toLowerCase();
  if (!term) return categories;

  return categories.flatMap((category) => {
    if (category.categoryName.toLowerCase().includes(term)) return [category];
    const matchedSubCategories = category.subCategories.filter((subCategory) =>
      subCategory.subCategoryName.toLowerCase().includes(term),
    );
    return matchedSubCategories.length > 0 ? [{ ...category, subCategories: matchedSubCategories }] : [];
  });
}

// ---------- ตารางหลัก ----------

export default function SummaryTable({ data, isLoading }: Props) {
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(new Set()); // เริ่มต้นขยายทุกหมวด
  const [openOrderList, setOpenOrderList] = useState<OpenOrderList | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  const toggleCategory = (categoryId: string) =>
    setCollapsedCategoryIds((previous) => {
      const next = new Set(previous);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  const expandAll = () => setCollapsedCategoryIds(new Set());
  const collapseAll = () => setCollapsedCategoryIds(new Set(data.categories.map((category) => category.categoryId)));

  const showOrderList: OpenOrderListHandler = (title, orderIds, tradeType) =>
    setOpenOrderList({ title, orderIds, tradeType });
  const closeOrderList = useCallback(() => setOpenOrderList(null), []);

  const visibleCategories = filterCategoriesByName(data.categories, tableSearch);
  const visibleSubCategoryCount = visibleCategories.reduce((sum, category) => sum + category.subCategories.length, 0);

  return (
    <div className="table-section-container">
      {/* แถบควบคุมตาราง: จำนวนที่แสดง, ค้นหาในตาราง, พับ/ขยาย, ส่งออก CSV */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="table-stat-badge">
            <span className="dot-active"></span>
            <span>
              แสดง <strong>{visibleCategories.length}</strong> หมวดหมู่ (<strong>{visibleSubCategoryCount}</strong>{' '}
              หมวดหมู่ย่อย)
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
              aria-label="ค้นหาชื่อสินค้าในตาราง"
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
            />
            {tableSearch && (
              <button type="button" className="clear-quick-search" onClick={() => setTableSearch('')} aria-label="ล้างคำค้นหา">
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

      {/* กรอบตาราง: เลื่อนได้ในตัว หัวตาราง/คอลัมน์ชื่อ/แถวรวม ค้างอยู่กับที่ */}
      <div className={`table-scroll-viewport ${isLoading ? 'dimmed' : ''}`} aria-busy={isLoading}>
        <table className="master-summary-table">
          <caption className="sr-only">ตารางสรุปยอดซื้อ ขาย และคงเหลือ แยกตามหมวดหมู่และหมวดหมู่ย่อย</caption>

          <thead>
            {/* แถวหัวที่ 1: กลุ่มคอลัมน์ */}
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

            {/* แถวหัวที่ 2: คอลัมน์ย่อย */}
            <tr className="header-sub-row">
              <SideHeaderCells tradeType="buy" />
              <SideHeaderCells tradeType="sell" />
              <th className="sub-th remain">กก. คงเหลือ</th>
              <th className="sub-th remain">เงินคงเหลือ (บ.)</th>
            </tr>
          </thead>

          {/* 1 หมวดหมู่ = 1 <tbody> (แถวหมวด + แถวหมวดย่อย) ตารางมีหลาย <tbody> ได้ตามมาตรฐาน HTML */}
          {visibleCategories.map((category) => {
            const isExpanded = !collapsedCategoryIds.has(category.categoryId);
            return (
              <tbody key={category.categoryId} className="category-tbody-group">
                <SummaryTableRow
                  name={category.categoryName}
                  row={category}
                  onOpenOrderList={showOrderList}
                  category={{
                    isExpanded,
                    onToggle: () => toggleCategory(category.categoryId),
                    subCategoryCount: category.subCategories.length,
                  }}
                />
                {isExpanded &&
                  category.subCategories.map((subCategory) => (
                    <SummaryTableRow
                      key={subCategory.subCategoryId}
                      name={subCategory.subCategoryName}
                      row={subCategory}
                      onOpenOrderList={showOrderList}
                    />
                  ))}
              </tbody>
            );
          })}

          {/* แถวรวมทั้งหมดท้ายตาราง */}
          <tfoot>
            <tr className="row-total-footer">
              <th scope="row" className="cell-name-sticky total-sticky">
                <div className="total-name-box">
                  <span className="total-badge">GRAND TOTAL</span>
                  <span className="total-label">รวมทั้งหมดทุกหมวด</span>
                </div>
              </th>
              <SideCells side={data.total.buy} tradeType="buy" rowTitle="รวมทั้งหมด (ฝั่งซื้อ)" onOpenOrderList={showOrderList} />
              <SideCells side={data.total.sell} tradeType="sell" rowTitle="รวมทั้งหมด (ฝั่งขาย)" onOpenOrderList={showOrderList} />
              <NumberCell value={data.total.remaining.totalKg} />
              <NumberCell value={data.total.remaining.totalBaht} isRemainingMoney />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* หน้าต่างเลขออเดอร์: render เฉพาะตอนเปิด */}
      {openOrderList && (
        <OrderIdsModal
          title={openOrderList.title}
          orderIds={openOrderList.orderIds}
          tradeType={openOrderList.tradeType}
          onClose={closeOrderList}
        />
      )}
    </div>
  );
}
