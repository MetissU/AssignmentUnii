import { formatNumber } from '@/lib/format';
import { SummaryRow } from '@/lib/types';

// การ์ดสรุปยอดรวมทุกหมวด 3 ใบ: ซื้อ / ขาย / คงเหลือ (อ่านเร็วก่อนลงรายละเอียดในตาราง)
export default function SummaryCards({ total }: { total: SummaryRow }) {
  return (
    <section className="cards" aria-label="ยอดรวมทั้งหมด">
      <article className="card buy">
        <h2>ซื้อรวม</h2>
        <p className="big">{formatNumber(total.buy.totalKg)} <small>กก.</small></p>
        <p className="sub">{formatNumber(total.buy.totalBaht)} บาท</p>
      </article>
      <article className="card sell">
        <h2>ขายรวม</h2>
        <p className="big">{formatNumber(total.sell.totalKg)} <small>กก.</small></p>
        <p className="sub">{formatNumber(total.sell.totalBaht)} บาท</p>
      </article>
      <article className="card">
        <h2>คงเหลือ (ซื้อ − ขาย)</h2>
        <p className="big">{formatNumber(total.remaining.totalKg)} <small>กก.</small></p>
        <p className="sub">{formatNumber(total.remaining.totalBaht)} บาท</p>
      </article>
    </section>
  );
}
