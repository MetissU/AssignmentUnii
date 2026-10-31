import { CategoryOption, Filters, SummaryResponse } from './types';

// ที่อยู่ backend (ตั้งค่าได้ด้วย NEXT_PUBLIC_API_URL)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`เรียก API ไม่สำเร็จ (HTTP ${response.status})`);
  return response.json();
}

/** แปลงค่าในฟอร์ม → query string; ข้ามช่องที่ว่าง */
export function toQuery(filters: Filters): string {
  const params = new URLSearchParams();
  const setIfFilled = (key: string, value: string) => value && params.set(key, value);

  setIfFilled('dateFrom', filters.dateFrom);
  setIfFilled('dateTo', filters.dateTo);
  setIfFilled('categoryId', filters.categoryId);
  setIfFilled('subCategoryId', filters.subCategoryId);
  setIfFilled('orderId', filters.orderId);
  if (filters.orderId) params.set('orderIdMode', filters.orderIdMode); // ส่งรูปแบบค้นหาเฉพาะตอนมีเลขออเดอร์
  setIfFilled('priceMin', filters.priceMin);
  setIfFilled('priceMax', filters.priceMax);
  setIfFilled('grade', filters.grades.join(','));

  return params.toString();
}

export const fetchCategories = () => getJson<CategoryOption[]>('/categories');
export const fetchSummary = (filters: Filters) => getJson<SummaryResponse>(`/summary?${toQuery(filters)}`);
