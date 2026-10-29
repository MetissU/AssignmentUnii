# API Reference

Base URL (local): `http://localhost:3001` — ไม่มี prefix และไม่ต้อง login

| Method | Path | ใช้ทำอะไร |
|---|---|---|
| GET | `/summary` | ตารางสรุปซื้อ–ขาย–คงเหลือ (รองรับ filter) |
| GET | `/categories` | รายการหมวดหมู่/หมวดย่อย (สำหรับ dropdown) |
| POST | `/sync` | ดึงข้อมูลจาก API ต้นทางมาเก็บ/อัปเดตใน MongoDB |

---

## GET /summary

### Query parameters (ทั้งหมด optional, ใช้ร่วมกันแบบ AND)

| ชื่อ | ชนิด | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|
| `dateFrom` | `YYYY-MM-DD` | `2024-04-01` | รวมวันนี้ |
| `dateTo` | `YYYY-MM-DD` | `2024-06-30` | รวมวันนี้ |
| `categoryId` | string | `01` | |
| `subCategoryId` | string | `0101` | |
| `orderId` | string | `UNII2024` | |
| `orderIdMode` | `exact` \| `contains` | `contains` | ค่าเริ่มต้น `exact` |
| `priceMin` | number | `20` | บาท/กก. |
| `priceMax` | number | `50` | บาท/กก. |
| `grade` | `A`,`B`,`C`,`D` คั่นด้วย `,` | `A,B` | |

ค่าผิดรูปแบบ (เช่น `dateFrom=abc`, `grade=Z`) → **HTTP 400** พร้อมข้อความระบุฟิลด์ที่ผิด

### ตัวอย่าง

```bash
# ทั้งหมด
curl "http://localhost:3001/summary"

# เกรด A และ B เฉพาะหมวด 01 ในไตรมาส 2/2024
curl "http://localhost:3001/summary?categoryId=01&grade=A,B&dateFrom=2024-04-01&dateTo=2024-06-30"

# ค้นเลขออเดอร์แบบ contains
curl "http://localhost:3001/summary?orderId=CUNIIPRO2024&orderIdMode=contains"
```

### Response (ย่อ)

```jsonc
{
  "categories": [
    {
      "categoryId": "01",
      "categoryName": "พลาสติก",
      "buy":  { "kg": 150, "baht": 5000, "minPrice": 30, "maxPrice": 35,
                "kgByGrade": { "A": 100, "B": 50, "C": 0, "D": 0 },
                "orderIds": ["CUNIIPRO20240409110012"] },
      "sell": { "kg": 40, "baht": 1600, "minPrice": 40, "maxPrice": 40,
                "kgByGrade": { "A": 40, "B": 0, "C": 0, "D": 0 },
                "orderIds": ["UNII20240507100042"] },
      "remaining": { "kg": 110, "baht": 3400 },   // ซื้อ − ขาย
      "subCategories": [
        { "subCategoryId": "0101", "subCategoryName": "…", "buy": {…}, "sell": {…}, "remaining": {…} }
      ]
    }
  ],
  "total": { "buy": {…}, "sell": {…}, "remaining": { "kg": 110, "baht": 3400 } }
}
```

- ฝั่งที่ไม่มีรายการ: `kg = 0`, `baht = 0`, `minPrice/maxPrice = null`, `orderIds = []`
- หมวด/หมวดย่อยที่ไม่มีข้อมูลหลัง filter จะ **ไม่อยู่ใน response**
- ไม่มีผลลัพธ์เลย → `{ "categories": [], "total": {…ศูนย์ทั้งหมด} }` (ไม่ใช่ error)

ชนิดข้อมูลทั้งหมด: [`backend/src/summary/summary.types.ts`](../backend/src/summary/summary.types.ts)

---

## GET /categories

```jsonc
[
  { "categoryId": "01", "categoryName": "พลาสติก",
    "subCategories": [ { "subCategoryId": "0101", "subCategoryName": "…" } ] }
]
```

---

## POST /sync

ไม่ต้องส่ง body — ดึงทั้ง 2 API ต้นทาง แปลง และ upsert ลง MongoDB (เรียกซ้ำได้ ข้อมูลไม่ซ้ำ)

```bash
curl -X POST http://localhost:3001/sync
# → { "categories": 14, "transactionLines": 521 }
```

ต้นทางล่ม/ตอบผิด → HTTP 500 และไม่แก้ข้อมูลเดิมใน DB (การดึงข้อมูลเสร็จก่อนเริ่มเขียน)
