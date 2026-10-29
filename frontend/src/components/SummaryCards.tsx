import { SummaryRow } from '@/lib/types';

const num = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 });

// การ์ดสรุปยอดรวมทุกหมวด 3 ใบ: ซื้อ / ขาย / คงเหลือ (อ่านเร็วก่อนลงรายละเอียดในตาราง)
export default function SummaryCards({ total }: { total: SummaryRow }) {
  return (
    <section className="cards" aria-label="ยอดรวมทั้งหมด">
      <article className="card buy">
        <h2>ซื้อรวม</h2>
        <p className="big">{num(total.buy.kg)} <small>กก.</small></p>
        <p className="sub">{num(total.buy.baht)} บาท</p>
      </article>
      <article className="card sell">
        <h2>ขายรวม</h2>
        <p className="big">{num(total.sell.kg)} <small>กก.</small></p>
        <p className="sub">{num(total.sell.baht)} บาท</p>
      </article>
      <article className="card">
        <h2>คงเหลือ (ซื้อ − ขาย)</h2>
        <p className="big">{num(total.remaining.kg)} <small>กก.</small></p>
        <p className="sub">{num(total.remaining.baht)} บาท</p>
      </article>
    </section>
  );
}
