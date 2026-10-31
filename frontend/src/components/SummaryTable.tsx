import { formatNumber, formatPriceRange } from '@/lib/format';
import { CategorySummary, GRADES, SideTotals, SummaryResponse, SummaryRow } from '@/lib/types';

// เซลล์ตัวเลข: ชิดขวา, ค่า 0 จางลง, ค่าติดลบเป็นสีแดง
function NumberCell({ value }: { value: number }) {
  const cellClass = value === 0 ? 'num zero' : value < 0 ? 'num neg' : 'num';
  return <td className={cellClass}>{formatNumber(value)}</td>;
}

// ---------- เซลล์ของ 1 ฝั่ง (ซื้อ หรือ ขาย) — 8 คอลัมน์ ----------
function SideCells({ side }: { side: SideTotals }) {
  return (
    <>
      <NumberCell value={side.totalKg} />
      <td className="num">{formatPriceRange(side.minPricePerKg, side.maxPricePerKg)}</td>
      {GRADES.map((grade) => (
        <NumberCell key={grade} value={side.kgByGrade[grade]} />
      ))}
      <td>
        {side.orderIds.length === 0 ? (
          '-'
        ) : (
          // เลขออเดอร์อาจมีหลายรายการ จึงพับเก็บไว้ กดเพื่อดู
          <details>
            <summary>{side.orderIds.length} ออเดอร์</summary>
            <ul>{side.orderIds.map((orderId) => <li key={orderId}>{orderId}</li>)}</ul>
          </details>
        )}
      </td>
      <NumberCell value={side.totalBaht} />
    </>
  );
}

// 1 แถวข้อมูล: ชื่อ | ซื้อ | ขาย | คงเหลือ
function SummaryTableRow({ name, row, className }: { name: string; row: SummaryRow; className?: string }) {
  return (
    <tr className={className}>
      <th scope="row">{name}</th>
      <SideCells side={row.buy} />
      <SideCells side={row.sell} />
      <NumberCell value={row.remaining.totalKg} />
      <NumberCell value={row.remaining.totalBaht} />
    </tr>
  );
}

// หัวคอลัมน์ของ 1 ฝั่ง (ซื้อและขายใช้ชุดเดียวกัน)
function SideHeaderCells() {
  return (
    <>
      <th>จำนวน (กก.)</th>
      <th>ราคา (บาท/กก.)</th>
      {GRADES.map((grade) => (
        <th key={grade}>เกรด {grade}</th>
      ))}
      <th>เลขออเดอร์</th>
      <th>ยอดรวม (บาท)</th>
    </>
  );
}

// หมวดหมู่ 1 หมวด = แถวสรุปหมวด + แถวหมวดย่อยทุกแถว
function CategoryRows({ category }: { category: CategorySummary }) {
  return (
    <>
      <SummaryTableRow name={category.categoryName} row={category} className="category" />
      {category.subCategories.map((subCategory) => (
        <SummaryTableRow key={subCategory.subCategoryId} name={subCategory.subCategoryName} row={subCategory} />
      ))}
    </>
  );
}

// isLoading = กำลังโหลดผลใหม่ (แสดงตารางเดิมแบบจางไว้ ไม่ให้หน้ากระโดด)
export default function SummaryTable({ data, isLoading }: { data: SummaryResponse; isLoading: boolean }) {
  return (
    <div className={isLoading ? 'table-wrap dim' : 'table-wrap'} aria-busy={isLoading}>
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
            <SideHeaderCells />
            <SideHeaderCells />
            <th>กก.</th>
            <th>บาท</th>
          </tr>
        </thead>

        <tbody>
          {data.categories.map((category) => (
            <CategoryRows key={category.categoryId} category={category} />
          ))}
        </tbody>

        <tfoot>
          <SummaryTableRow name="รวมทั้งหมด" row={data.total} />
        </tfoot>
      </table>
    </div>
  );
}
