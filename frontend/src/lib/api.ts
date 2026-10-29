import { CategoryOption, Filters, SummaryResponse } from './types';

// ที่อยู่ backend (ตั้งค่าได้ด้วย NEXT_PUBLIC_API_URL)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`เรียก API ไม่สำเร็จ (HTTP ${res.status})`);
  return res.json();
}

/** แปลงค่าในฟอร์ม → query string; ข้ามช่องที่ว่าง */
export function toQuery(f: Filters): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string) => value && params.set(key, value);

  set('dateFrom', f.dateFrom);
  set('dateTo', f.dateTo);
  set('categoryId', f.categoryId);
  set('subCategoryId', f.subCategoryId);
  set('orderId', f.orderId);
  if (f.orderId) params.set('orderIdMode', f.orderIdMode);
  set('priceMin', f.priceMin);
  set('priceMax', f.priceMax);
  set('grade', f.grades.join(','));

  return params.toString();
}

export const fetchCategories = () => getJson<CategoryOption[]>('/categories');
export const fetchSummary = (f: Filters) => getJson<SummaryResponse>(`/summary?${toQuery(f)}`);
