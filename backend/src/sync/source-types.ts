// ชนิดข้อมูลดิบจาก 2 API ต้นทาง (ตรงกับ JSON จริง) — ใช้เฉพาะในโฟลเดอร์ sync

// --- GET /category/query-product-demo ---
export interface RawCategoryResponse {
  productList: {
    categoryId: string;
    categoryName: string;
    subcategory: { subCategoryId: string; subCategoryName: string }[];
  }[];
}

// --- GET /Stock/query-transaction-demo ---
export interface RawGradeLine {
  grade: string; // "A" | "B" | "C" | "D"
  price: number;
  quantity: string; // ต้นทางส่งมาเป็น string เช่น "25" หรือ "0"
  total: number;
}

export interface RawOrder {
  orderId: string;
  orderFinishedDate: string; // "YYYY-MM-DD"
  requestList: {
    categoryID: string;
    subCategoryID: string;
    requestList: RawGradeLine[]; // มี 4 บรรทัด (A–D) เสมอ แต่เกรดที่ไม่มีของจะเป็น 0
  }[];
}

export interface RawTransactionResponse {
  buyTransaction: RawOrder[];
  sellTransaction: RawOrder[];
}
