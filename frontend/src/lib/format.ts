// ตัวช่วยจัดรูปแบบตัวเลขสำหรับแสดงผล (ใช้ร่วมกันทุก component)

/** ตัวเลขแบบมีคอมม่า ทศนิยมไม่เกิน 2 ตำแหน่ง เช่น 1234.5 → "1,234.5" */
export const formatNumber = (value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 2 });

/** ช่วงราคา: ราคาเดียว → "35", หลายราคา → "30–35", ไม่มีรายการ → "-" */
export function formatPriceRange(minPricePerKg: number | null, maxPricePerKg: number | null) {
  if (minPricePerKg === null || maxPricePerKg === null) return '-';
  return minPricePerKg === maxPricePerKg
    ? formatNumber(minPricePerKg)
    : `${formatNumber(minPricePerKg)}–${formatNumber(maxPricePerKg)}`;
}
