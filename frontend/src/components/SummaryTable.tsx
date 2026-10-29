import { GRADES, Side, SummaryResponse, SummaryRow } from '@/lib/types';

// ---------- ตัวช่วยจัดรูปแบบ ----------
const num = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 });

// ช่วงราคา: ราคาเดียว → "35", หลายราคา → "30–35", ไม่มี → "-"
function priceRange(min: number | null, max: number | null) {
  if (min === null || max === null) return '-';
  return min === max ? num(min) : `${num(min)}–${num(max)}`;
}

// ---------- เซลล์ของ 1 ฝั่ง (ซื้อ หรือ ขาย) — 8 คอลัมน์ ----------
function SideCells({ side }: { side: Side }) {
  return (
    <>
      <td className="num">{num(side.kg)}</td>
      <td className="num">{priceRange(side.minPrice, side.maxPrice)}</td>
      {GRADES.map((g) => (
        <td key={g} className="num">{num(side.kgByGrade[g])}</td>
      ))}
      <td>
        {side.orderIds.length === 0 ? (
          '-'
        ) : (
          // เลขออเดอร์อาจมีหลายรายการ จึงพับเก็บไว้ กดเพื่อดู
          <details>
            <summary>{side.orderIds.length} ออเดอร์</summary>
            <ul>{side.orderIds.map((id) => <li key={id}>{id}</li>)}</ul>
          </details>
        )}
      </td>
      <td className="num">{num(side.baht)}</td>
    </>
  );
}

// 1 แถวข้อมูล: ชื่อ | ซื้อ | ขาย | คงเหลือ
function DataRow({ name, row, className }: { name: string; row: SummaryRow; className?: string }) {
  return (
    <tr className={className}>
      <th scope="row">{name}</th>
      <SideCells side={row.buy} />
      <SideCells side={row.sell} />
      <td className="num">{num(row.remaining.kg)}</td>
      <td className="num">{num(row.remaining.baht)}</td>
    </tr>
  );
}

export default function SummaryTable({ data }: { data: SummaryResponse }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          {/* แถวหัวระดับกลุ่ม */}
          <tr>
            <th rowSpan={2}>หมวดหมู่ / หมวดหมู่ย่อย</th>
            <th colSpan={8} className="group-buy">ซื้อ</th>
            <th colSpan={8} className="group-sell">ขาย</th>
            <th colSpan={2} className="group-rest">คงเหลือ</th>
          </tr>
          {/* แถวหัวระดับคอลัมน์ (ซื้อและขายใช้ชุดเดียวกัน) */}
          <tr>
            {[0, 1].map((i) => (
              <HeaderCells key={i} />
            ))}
            <th>กก.</th>
            <th>บาท</th>
          </tr>
        </thead>

        <tbody>
          {data.categories.map((cat) => (
            <CategoryBlock key={cat.categoryId} cat={cat} />
          ))}
        </tbody>

        <tfoot>
          <DataRow name="รวมทั้งหมด" row={data.total} className="grand" />
        </tfoot>
      </table>
    </div>
  );
}

function HeaderCells() {
  return (
    <>
      <th>จำนวน (กก.)</th>
      <th>ราคา (บาท/กก.)</th>
      {GRADES.map((g) => (
        <th key={g}>เกรด {g}</th>
      ))}
      <th>เลขออเดอร์</th>
      <th>ยอดรวม (บาท)</th>
    </>
  );
}

// หมวดหมู่ 1 หมวด = แถวสรุปหมวด + แถวหมวดย่อยทุกแถว
function CategoryBlock({ cat }: { cat: SummaryResponse['categories'][number] }) {
  return (
    <>
      <DataRow name={cat.categoryName} row={cat} className="category" />
      {cat.subCategories.map((sub) => (
        <DataRow key={sub.subCategoryId} name={sub.subCategoryName} row={sub} />
      ))}
    </>
  );
}
