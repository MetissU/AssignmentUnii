import { CategorySummary, GRADES, Side, SummaryResponse, SummaryRow } from '@/lib/types';

// ---------- ตัวช่วยจัดรูปแบบ ----------
const num = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 2 });

// ช่วงราคา: ราคาเดียว → "35", หลายราคา → "30–35", ไม่มี → "-"
function priceRange(min: number | null, max: number | null) {
  if (min === null || max === null) return '-';
  return min === max ? num(min) : `${num(min)}–${num(max)}`;
}

// เซลล์ตัวเลข: ชิดขวา, ค่า 0 จางลง, ค่าติดลบเป็นสีแดง
function Num({ value }: { value: number }) {
  const cls = value === 0 ? 'num zero' : value < 0 ? 'num neg' : 'num';
  return <td className={cls}>{num(value)}</td>;
}

// ---------- เซลล์ของ 1 ฝั่ง (ซื้อ หรือ ขาย) — 8 คอลัมน์ ----------
function SideCells({ side }: { side: Side }) {
  return (
    <>
      <Num value={side.kg} />
      <td className="num">{priceRange(side.minPrice, side.maxPrice)}</td>
      {GRADES.map((g) => (
        <Num key={g} value={side.kgByGrade[g]} />
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
      <Num value={side.baht} />
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
      <Num value={row.remaining.kg} />
      <Num value={row.remaining.baht} />
    </tr>
  );
}

// หัวคอลัมน์ของ 1 ฝั่ง (ซื้อและขายใช้ชุดเดียวกัน)
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
function CategoryBlock({ cat }: { cat: CategorySummary }) {
  return (
    <>
      <DataRow name={cat.categoryName} row={cat} className="category" />
      {cat.subCategories.map((sub) => (
        <DataRow key={sub.subCategoryId} name={sub.subCategoryName} row={sub} />
      ))}
    </>
  );
}

// loading = กำลังโหลดผลใหม่ (แสดงตารางเดิมแบบจางไว้ ไม่ให้หน้ากระโดด)
export default function SummaryTable({ data, loading }: { data: SummaryResponse; loading: boolean }) {
  return (
    <div className={loading ? 'table-wrap dim' : 'table-wrap'} aria-busy={loading}>
      <table>
        <caption className="sr-only">ตารางสรุปยอดซื้อ ขาย และคงเหลือ แยกตามหมวดหมู่และหมวดหมู่ย่อย</caption>
        <thead>
          {/* แถวหัวระดับกลุ่ม */}
          <tr>
            <th rowSpan={2}>หมวดหมู่ / หมวดหมู่ย่อย</th>
            <th colSpan={8}>ซื้อ</th>
            <th colSpan={8} className="group-sell">ขาย</th>
            <th colSpan={2} className="group-rest">คงเหลือ</th>
          </tr>
          {/* แถวหัวระดับคอลัมน์ */}
          <tr>
            <HeaderCells />
            <HeaderCells />
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
          <DataRow name="รวมทั้งหมด" row={data.total} />
        </tfoot>
      </table>
    </div>
  );
}
