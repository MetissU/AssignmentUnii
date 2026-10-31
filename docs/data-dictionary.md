# Data Dictionary

ความหมายของข้อมูลทุกตัวในระบบ ตั้งแต่ API ต้นทาง → MongoDB → API ของเรา → หน้าเว็บ
ถ้าชื่อฟิลด์ในโค้ดไม่ตรงกับเอกสารนี้ ให้ถือว่าเอกสารนี้ต้องแก้ตาม และแก้ในคราวเดียวกัน

## 1. กติกาการตั้งชื่อ

| กติกา | ตัวอย่าง | เหตุผล |
|---|---|---|
| ใส่หน่วยไว้ท้ายชื่อตัวเลขเสมอ | `quantityKg`, `amountBaht`, `pricePerKg` | อ่านชื่อแล้วรู้หน่วยทันที ไม่ต้องเดา |
| `total` นำหน้า = ผลรวมหลายบรรทัด | `totalKg`, `totalBaht` | แยกจากค่าของบรรทัดเดียว (`quantityKg`, `amountBaht`) |
| `min` / `max` นำหน้า = ค่าต่ำสุด / สูงสุด | `minPricePerKg` | |
| `Id` ท้ายชื่อ = รหัส (string) | `categoryId`, `orderId` | |
| `is` นำหน้า = ค่า true/false | `isLoading` | |
| ชื่อ collection เป็นพหูพจน์ snake_case | `transaction_lines` | ตามธรรมเนียม MongoDB |
| ชื่อฟิลด์เป็น camelCase ภาษาอังกฤษ | `orderFinishedDate` | ตรงกับโค้ด TypeScript |

## 2. ค่าที่กำหนดไว้ (Enum)

| ชื่อ | ค่าที่เป็นได้ | ความหมาย | ประกาศที่ |
|---|---|---|---|
| `TradeType` | `buy`, `sell` | ฝั่งซื้อ / ฝั่งขาย | `backend/src/transactions/transaction-line.schema.ts` |
| `Grade` | `A`, `B`, `C`, `D` | เกรดสินค้า | ไฟล์เดียวกัน (`GRADES`) และ `frontend/src/lib/types.ts` |
| `orderIdMode` | `exact`, `contains` | ค้นเลขออเดอร์แบบตรงทั้งหมด / มีข้อความนี้ | `backend/src/summary/summary-query.dto.ts` |

## 3. ข้อมูลต้นทาง (API ของ Unii)

### 3.1 `GET /Stock/query-transaction-demo`

ตอบ `{ buyTransaction: Order[], sellTransaction: Order[] }`

| ฟิลด์ต้นทาง | ชนิด | ตัวอย่าง | ความหมาย | ใช้ไหม |
|---|---|---|---|---|
| `orderId` | string | `CUNIIPRO20240409110012` | เลขออเดอร์ | ใช้ |
| `orderFinishedDate` | string `YYYY-MM-DD` | `2024-04-09` | วันที่ออเดอร์เสร็จ | ใช้ (filter วันที่) |
| `orderFinishedTime` | string `HH:MM` | `13:30` | เวลาที่ออเดอร์เสร็จ | ไม่ใช้ (filter ระดับวัน) |
| `transactionParties` | object / null | | ลูกค้า ขนส่ง ผู้รับซื้อ | ไม่ใช้ |
| `requestList[].categoryID` | string | `05` | รหัสหมวดหมู่ (สังเกต `ID` ตัวใหญ่) | ใช้ |
| `requestList[].subCategoryID` | string | `0523` | รหัสหมวดย่อย | ใช้ |
| `requestList[].requestList[].grade` | string | `A` | เกรด | ใช้ |
| `requestList[].requestList[].price` | number | `65` | ราคา บาท/กก. | ใช้ |
| `requestList[].requestList[].quantity` | **string** | `"25"` | จำนวน กก. (เป็น string และอาจมีทศนิยม) | ใช้ (แปลงเป็นตัวเลข) |
| `requestList[].requestList[].total` | number | `1625` | ยอดเงินของบรรทัด (ไม่เท่ากับ price × quantity เสมอไป) | ใช้ |
| `stability`, `requestList[].quantity` | | | ไม่มีความหมายในโจทย์ | ไม่ใช้ |

### 3.2 `GET /category/query-product-demo`

ตอบ `{ StatusCode, success, productList: Category[] }`

| ฟิลด์ต้นทาง | ชนิด | ตัวอย่าง | ความหมาย |
|---|---|---|---|
| `productList[].categoryId` | string | `01` | รหัสหมวดหมู่ |
| `productList[].categoryName` | string | `พลาสติก` | ชื่อหมวดหมู่ |
| `productList[].subcategory[].subCategoryId` | string | `0101` | รหัสหมวดย่อย |
| `productList[].subcategory[].subCategoryName` | string | `ขวดน้ำPETใสในเครือเป๊ปซี่` | ชื่อหมวดย่อย |

## 4. การแปลงข้อมูล (ต้นทาง → MongoDB)

ทำใน `backend/src/sync/normalize.ts`

| ต้นทาง | → ของเรา | การแปลง |
|---|---|---|
| ชื่อ array (`buyTransaction` / `sellTransaction`) | `tradeType` | `buy` / `sell` |
| `orderId` | `orderId` | คัดลอก |
| `categoryID` | `categoryId` | คัดลอก (เปลี่ยนตัวพิมพ์ให้ตรงกับ API หมวดหมู่) |
| `subCategoryID` | `subCategoryId` | คัดลอก |
| `grade` | `grade` | คัดลอก; เกรดนอก A–D ถูกข้าม |
| `price` | `pricePerKg` | คัดลอก |
| `quantity` | `quantityKg` | `Number(quantity)`; ถ้า ≤ 0 ข้ามทั้งบรรทัด |
| `total` | `amountBaht` | คัดลอก (ไม่คำนวณใหม่) |
| `orderFinishedDate` | `orderFinishedDate` | `"2024-04-09"` → `Date 2024-04-09T00:00:00.000Z` |
| `subcategory` | `subCategories` | เปลี่ยนชื่อ array ของหมวดย่อย |

ออเดอร์ 1 ใบที่มี 2 หมวดย่อย หมวดละ 2 เกรดที่มีของ → 4 document ใน `transaction_lines`

## 5. MongoDB

### 5.1 Collection `categories` — 1 document = 1 หมวดหมู่

| ฟิลด์ | ชนิด | บังคับ | ตัวอย่าง | ความหมาย |
|---|---|---|---|---|
| `categoryId` | string | ✓ (unique) | `01` | รหัสหมวดหมู่ |
| `categoryName` | string | ✓ | `พลาสติก` | ชื่อหมวดหมู่ |
| `subCategories` | array | | | หมวดย่อยทั้งหมดของหมวดนี้ (ฝังใน document) |
| `subCategories[].subCategoryId` | string | ✓ | `0101` | รหัสหมวดย่อย |
| `subCategories[].subCategoryName` | string | ✓ | `ขวดน้ำPETใส` | ชื่อหมวดย่อย |

ข้อมูลตัวอย่าง: 14 หมวด (ไม่มีรหัส `10`)

### 5.2 Collection `transaction_lines` — 1 document = 1 บรรทัดสินค้า (ออเดอร์ × หมวดย่อย × เกรด)

| ฟิลด์ | ชนิด | บังคับ | หน่วย | ตัวอย่าง | ความหมาย |
|---|---|---|---|---|---|
| `orderId` | string | ✓ | | `UNII20240507100042` | เลขออเดอร์ |
| `tradeType` | `buy` \| `sell` | ✓ | | `sell` | ฝั่งซื้อ หรือฝั่งขาย |
| `categoryId` | string | ✓ | | `01` | รหัสหมวดหมู่ (เก็บซ้ำเพื่อกรองโดยไม่ต้อง join) |
| `subCategoryId` | string | ✓ | | `0101` | รหัสหมวดย่อย |
| `grade` | `A`–`D` | ✓ | | `A` | เกรดสินค้า |
| `pricePerKg` | number | ✓ | บาท/กก. | `66` | ราคาต่อกิโลกรัมของบรรทัดนี้ (อาจเป็น 0 ได้ในข้อมูลตัวอย่าง) |
| `quantityKg` | number | ✓ | กก. | `45` | จำนวน (มากกว่า 0 เสมอ) |
| `amountBaht` | number | ✓ | บาท | `2970` | ยอดเงินของบรรทัดนี้ ตาม `total` ของต้นทาง |
| `orderFinishedDate` | Date | ✓ | | `2024-05-07T00:00:00.000Z` | วันที่ออเดอร์เสร็จ (00:00 UTC) |

ข้อมูลตัวอย่าง: 521 document (ออเดอร์ซื้อ 83 ใบ, ขาย 110 ใบ)

### 5.3 Index

| Collection | Index | ชนิด | ใช้ทำอะไร |
|---|---|---|---|
| `categories` | `categoryId` | unique | หมวดหมู่ไม่ซ้ำ |
| `transaction_lines` | `orderId + tradeType + subCategoryId + grade` | unique | กันบรรทัดซ้ำ ทำให้ sync ซ้ำได้ |
| `transaction_lines` | `orderFinishedDate` | ปกติ | filter ช่วงวัน |
| `transaction_lines` | `categoryId + subCategoryId` | ปกติ | filter หมวดหมู่ / หมวดย่อย |

## 6. API ของเรา

### 6.1 Query ของ `GET /summary` — ทุกตัวเป็น optional และใช้ร่วมกันแบบ AND

| พารามิเตอร์ | ชนิด / รูปแบบ | ตัวอย่าง | กรองฟิลด์ | กติกา |
|---|---|---|---|---|
| `dateFrom` | `YYYY-MM-DD` | `2024-04-01` | `orderFinishedDate` | ≥ วันนี้ (รวมวันนี้) |
| `dateTo` | `YYYY-MM-DD` | `2024-06-30` | `orderFinishedDate` | ≤ วันนี้ (รวมวันนี้) |
| `categoryId` | string | `01` | `categoryId` | เท่ากับ |
| `subCategoryId` | string | `0101` | `subCategoryId` | เท่ากับ |
| `orderId` | string | `UNII2024` | `orderId` | ตาม `orderIdMode` |
| `orderIdMode` | `exact` \| `contains` | `contains` | | ค่าเริ่มต้น `exact`; `contains` ไม่สนตัวพิมพ์เล็กใหญ่ |
| `priceMin` | number (บาท/กก.) | `20` | `pricePerKg` | ≥ ค่านี้ |
| `priceMax` | number (บาท/กก.) | `50` | `pricePerKg` | ≤ ค่านี้ |
| `grade` | เกรดคั่นด้วย `,` | `A,B` | `grade` | อยู่ในรายการ |

ค่าผิดรูปแบบ → HTTP 400

### 6.2 Response ของ `GET /summary`

```text
SummaryResponse
├─ categories: CategorySummary[]        หมวดหมู่ที่มีข้อมูลหลัง filter (เรียงตาม categoryId)
│   ├─ categoryId, categoryName
│   ├─ buy / sell / remaining           ยอดรวมของทั้งหมวด
│   └─ subCategories: SubCategorySummary[]
│       ├─ subCategoryId, subCategoryName
│       └─ buy / sell / remaining       ยอดของหมวดย่อยนี้
└─ total: { buy, sell, remaining }      ยอดรวมทุกหมวด
```

**`buy` และ `sell` (ชนิด `SideTotals`)**

| ฟิลด์ | ชนิด | หน่วย | คำนวณจาก (บรรทัดที่ผ่าน filter ของฝั่งนั้น) |
|---|---|---|---|
| `totalKg` | number | กก. | ผลรวม `quantityKg` |
| `totalBaht` | number | บาท | ผลรวม `amountBaht` |
| `minPricePerKg` | number \| null | บาท/กก. | ค่าต่ำสุดของ `pricePerKg` (null = ไม่มีรายการ) |
| `maxPricePerKg` | number \| null | บาท/กก. | ค่าสูงสุดของ `pricePerKg` |
| `kgByGrade` | `{ A, B, C, D }` | กก. | ผลรวม `quantityKg` แยกตาม `grade` |
| `orderIds` | string[] | | `orderId` ที่เกี่ยวข้อง ไม่ซ้ำ เรียงตามตัวอักษร |

**`remaining` (ชนิด `RemainingTotals`)**

| ฟิลด์ | ชนิด | หน่วย | สูตร |
|---|---|---|---|
| `totalKg` | number | กก. | `buy.totalKg − sell.totalKg` (ติดลบได้) |
| `totalBaht` | number | บาท | `buy.totalBaht − sell.totalBaht` (ติดลบได้) |

ตัวเลขทุกตัวปัดทศนิยม 2 ตำแหน่ง

### 6.3 Response อื่น

| Endpoint | Response |
|---|---|
| `GET /categories` | array ของ `{ categoryId, categoryName, subCategories[] }` เหมือน collection `categories` |
| `POST /sync` | `{ categories: number, transactionLines: number }` = จำนวนที่นำเข้า |

## 7. หน้าเว็บ (Frontend)

### 7.1 ค่าในฟอร์ม `Filters` (`frontend/src/lib/types.ts`)

ทุกช่องเก็บเป็น string เพราะมาจาก `<input>` ค่าว่าง `''` = ไม่กรอง

| ฟิลด์ | ชนิด | ส่งเป็นพารามิเตอร์ | หมายเหตุ |
|---|---|---|---|
| `dateFrom`, `dateTo` | string | `dateFrom`, `dateTo` | จาก `<input type="date">` |
| `categoryId` | string | `categoryId` | เปลี่ยนแล้วล้าง `subCategoryId` |
| `subCategoryId` | string | `subCategoryId` | เลือกได้เฉพาะหมวดย่อยของหมวดที่เลือก |
| `orderId` | string | `orderId` | |
| `orderIdMode` | `exact` \| `contains` | `orderIdMode` | ส่งเฉพาะตอนมี `orderId` |
| `priceMin`, `priceMax` | string | `priceMin`, `priceMax` | API แปลงเป็นตัวเลขเอง |
| `grades` | `Grade[]` | `grade` (ต่อด้วย `,`) | |

### 7.2 State ของหน้า (`frontend/src/app/page.tsx`)

| State | ชนิด | ความหมาย |
|---|---|---|
| `filters` | `Filters` | ค่าในฟอร์มตอนนี้ (ยังไม่ค้นหา) |
| `categories` | `CategoryOption[]` | รายการสำหรับ dropdown |
| `data` | `SummaryResponse \| null` | ผลสรุปที่แสดงอยู่ |
| `isLoading` | boolean | กำลังโหลดผลอยู่ไหม |
| `error` | string | ข้อความผิดพลาด (`''` = ไม่มี) |

## 8. คำศัพท์ (ไทย ↔ ชื่อในระบบ)

| คำในโจทย์ | ชื่อในระบบ |
|---|---|
| หมวดหมู่ / หมวดหมู่ย่อย | `category` / `subCategory` |
| ฝั่งซื้อ / ฝั่งขาย | `buy` / `sell` (`tradeType`) |
| จำนวน (กก.) | `quantityKg` (1 บรรทัด), `totalKg` (ผลรวม) |
| ราคา (บาท/กก.) | `pricePerKg`, ช่วงราคา = `minPricePerKg`–`maxPricePerKg` |
| ยอดรวม (บาท) | `amountBaht` (1 บรรทัด), `totalBaht` (ผลรวม) |
| จำนวนแยกตามเกรด | `kgByGrade` |
| เลขออเดอร์ | `orderId`, รายการ = `orderIds` |
| คงเหลือ | `remaining` |
| บรรทัดสินค้า | `TransactionLine` (collection `transaction_lines`) |
