import { formatNumber } from '@/lib/format';
import { SummaryRow } from '@/lib/types';

interface Props {
  total: SummaryRow;
}

// การ์ดยอดรวมทุกหมวด 3 ใบ (ซื้อ / ขาย / คงเหลือ) + แถบสัดส่วนขายเทียบซื้อ
// อ่านภาพรวมได้ก่อนลงรายละเอียดในตาราง ไม่มี state
export default function SummaryCards({ total }: Props) {
  const isRemainingPositive = total.remaining.totalKg >= 0;
  const isRemainingMoneyPositive = total.remaining.totalBaht >= 0;

  // คำนวณสัดส่วนขายเทียบกับซื้อ (%)
  const sellRatioPercent =
    total.buy.totalKg > 0
      ? Math.min(100, Math.round((total.sell.totalKg / total.buy.totalKg) * 100))
      : 0;

  return (
    <section className="cards-wrapper" aria-label="ภาพรวมยอดรวมทั้งหมด">
      <div className="cards-grid">
        {/* การ์ดที่ 1: ยอดซื้อรวม */}
        <article className="stat-card card-buy">
          <div className="card-top">
            <div className="card-icon buy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M19 12l-7 7-7-7"></path>
              </svg>
            </div>
            <div className="card-meta">
              <span className="card-category">ภาพรวมการรับเข้า</span>
              <h2 className="card-heading">ยอดซื้อรวม</h2>
            </div>
            <span className="order-pill buy">{total.buy.orderIds.length} ออเดอร์</span>
          </div>

          <div className="card-main-val">
            <span className="val-big">{formatNumber(total.buy.totalKg)}</span>
            <span className="val-unit">กก.</span>
          </div>

          <div className="card-bottom">
            <span className="sub-label">มูลค่ารวม</span>
            <span className="sub-val buy">{formatNumber(total.buy.totalBaht)} บาท</span>
          </div>
        </article>

        {/* การ์ดที่ 2: ยอดขายรวม */}
        <article className="stat-card card-sell">
          <div className="card-top">
            <div className="card-icon sell">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7"></path>
              </svg>
            </div>
            <div className="card-meta">
              <span className="card-category">ภาพรวมการจำหน่าย</span>
              <h2 className="card-heading">ยอดขายรวม</h2>
            </div>
            <span className="order-pill sell">{total.sell.orderIds.length} ออเดอร์</span>
          </div>

          <div className="card-main-val">
            <span className="val-big">{formatNumber(total.sell.totalKg)}</span>
            <span className="val-unit">กก.</span>
          </div>

          <div className="card-bottom">
            <span className="sub-label">มูลค่ารวม</span>
            <span className="sub-val sell">{formatNumber(total.sell.totalBaht)} บาท</span>
          </div>
        </article>

        {/* การ์ดที่ 3: ยอดคงเหลือสุทธิ */}
        <article className={`stat-card card-remain ${isRemainingPositive ? 'positive' : 'negative'}`}>
          <div className="card-top">
            <div className="card-icon remain">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path>
                <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4"></path>
                <circle cx="8" cy="12" r="2"></circle>
              </svg>
            </div>
            <div className="card-meta">
              <span className="card-category">คงเหลือ (ซื้อ − ขาย)</span>
              <h2 className="card-heading">สต็อกและเงินสุทธิ</h2>
            </div>
            <span className={`status-pill ${isRemainingPositive ? 'positive' : 'negative'}`}>
              {isRemainingPositive ? '✓ สต็อกบวก' : '⚠ ขายมากกว่าซื้อ'}
            </span>
          </div>

          <div className="card-main-val">
            <span className={`val-big ${isRemainingPositive ? '' : 'neg-text'}`}>
              {formatNumber(total.remaining.totalKg)}
            </span>
            <span className="val-unit">กก.</span>
          </div>

          <div className="card-bottom">
            <span className="sub-label">เงินคงเหลือ</span>
            <span className={`sub-val ${isRemainingMoneyPositive ? 'positive' : 'neg-text'}`}>
              {formatNumber(total.remaining.totalBaht)} บาท
            </span>
          </div>
        </article>
      </div>

      {/* แถบสัดส่วนการจำหน่าย (Sell / Buy ratio bar) */}
      {total.buy.totalKg > 0 && (
        <div className="ratio-bar-wrap">
          <div className="ratio-header">
            <span className="ratio-title">สัดส่วนการจำหน่ายเทียบกับยอดซื้อ (Sell-Through Rate)</span>
            <span className="ratio-percentage">{sellRatioPercent}%</span>
          </div>
          <div className="ratio-track">
            <div
              className="ratio-fill"
              style={{ width: `${sellRatioPercent}%` }}
              role="progressbar"
              aria-valuenow={sellRatioPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
          <div className="ratio-legend">
            <span className="legend-item buy">
              <span className="dot buy"></span> ซื้อ: {formatNumber(total.buy.totalKg)} กก.
            </span>
            <span className="legend-item sell">
              <span className="dot sell"></span> ขาย: {formatNumber(total.sell.totalKg)} กก.
            </span>
            <span className="legend-item remain">
              <span className="dot remain"></span> คงเหลือ: {formatNumber(total.remaining.totalKg)} กก.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
