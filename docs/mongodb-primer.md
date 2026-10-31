# MongoDB สำหรับมือใหม่ (ฉบับสั้น เฉพาะที่โปรเจกต์นี้ใช้)

## MongoDB คืออะไร

ฐานข้อมูลแบบ **NoSQL / document database** — เก็บข้อมูลเป็นเอกสาร JSON แทนตารางและแถว

| SQL | MongoDB | ในโปรเจกต์นี้ |
|---|---|---|
| Database | Database | `unii` |
| Table | **Collection** | `categories`, `transaction_lines` |
| Row | **Document** (JSON) | 1 หมวดหมู่ / 1 บรรทัดสินค้า |
| Column | Field | `orderId`, `pricePerKg` … |
| `WHERE` | `$match` / `find({...})` | `buildMatch()` |
| `GROUP BY` + `SUM` | `$group` + `$sum` | `summary.service.ts` |
| Index / Unique | Index / Unique | `transaction-line.schema.ts` |

ไม่ต้องสร้างตารางล่วงหน้า — Mongoose (ไลบรารีที่ใช้) สร้าง collection และ index จาก schema ในโค้ดให้เอง

## ข้อดี / ข้อเสีย (ในมุมโปรเจกต์นี้)

**ข้อดี**
- ข้อมูลต้นทางเป็น JSON ซ้อนหลายชั้น เก็บและอ่านได้เกือบตรงๆ
- ไม่ต้องเขียน migration เมื่อเพิ่มฟิลด์
- Aggregation pipeline เหมาะกับงาน "กรอง → รวมยอดตามกลุ่ม" ซึ่งเป็นหัวใจของโจทย์นี้
- ใช้กับ NestJS ผ่าน `@nestjs/mongoose` ได้สะดวก

**ข้อเสีย / ข้อควรระวัง**
- ไม่บังคับโครงสร้างให้ → ต้องตรวจเอง (เช่น `quantity` ต้นทางเป็น string ต้องแปลงเป็น number ก่อนบันทึก — ดู `normalize.ts`)
- JOIN ข้อมูลหลายชุดทำได้แต่ไม่คล่องเท่า SQL → โปรเจกต์นี้จึงเลี่ยงด้วยการเก็บ "บรรทัดสินค้า" แบบแบน (flatten) และ join ชื่อหมวดหมู่ในโค้ด (`buildSummary`)
- ไม่มี transaction/relational integrity แบบเข้ม ถ้าข้อมูลมีความสัมพันธ์ซับซ้อนมากๆ ควรพิจารณา PostgreSQL
- Aggregation pipeline อ่านยากถ้าเขียนยาว → ที่นี่เก็บให้สั้นที่สุด (2 ขั้น) และเอา logic ที่เหลือไปไว้ในฟังก์ชัน TypeScript ที่เทสได้

## การออกแบบข้อมูลของโปรเจกต์

**`categories`** — 1 document ต่อหมวดหมู่ ฝังหมวดย่อยไว้ข้างใน (อ่านพร้อมกันเสมอ และมีจำนวนน้อย)

```json
{ "categoryId": "01", "categoryName": "พลาสติก",
  "subCategories": [ { "subCategoryId": "0101", "subCategoryName": "ขวดน้ำ PET ใส" } ] }
```

**`transaction_lines`** — 1 document ต่อ 1 บรรทัด (ออเดอร์ × หมวดย่อย × เกรด)

```json
{ "orderId": "UNII20240507100042", "tradeType": "sell", "categoryId": "01", "subCategoryId": "0101",
  "grade": "A", "pricePerKg": 66, "quantityKg": 45, "amountBaht": 2970,
  "orderFinishedDate": "2024-05-07T00:00:00.000Z" }
```

ทำไมไม่เก็บออเดอร์ตามรูปต้นทาง (ซ้อน 3 ชั้น)? เพราะ filter ราคา/เกรดต้องทำที่ระดับบรรทัด ถ้าเก็บซ้อนต้อง `$unwind` สองรอบทุกครั้งที่ query

## Aggregation ของ `GET /summary` ทีละขั้น

ใน `backend/src/summary/summary.service.ts`:

```text
transaction_lines
   │
   ▼  $match   → เก็บเฉพาะบรรทัดที่ตรง filter (วัน/หมวด/ออเดอร์/ราคา/เกรด)
   │
   ▼  $group   → จัดกลุ่มตาม (หมวด, หมวดย่อย, ซื้อ/ขาย, เกรด) แล้วคำนวณ
   │             totalKg = $sum quantityKg        totalBaht = $sum amountBaht
   │             minPricePerKg = $min pricePerKg  maxPricePerKg = $max pricePerKg
   │             orderIds = $addToSet orderId  (รวมเลขออเดอร์แบบไม่ซ้ำ)
   ▼
แถวสรุป (หลักสิบ–ร้อยแถว) → ส่งต่อให้ buildSummary() ใน TypeScript
                            ประกอบเป็น หมวด → หมวดย่อย → ซื้อ/ขาย/คงเหลือ
```

เทียบกับ SQL ที่เขียนเอง:

```sql
SELECT category_id, sub_category_id, trade_type, grade,
       SUM(quantity_kg), SUM(amount_baht), MIN(price_per_kg), MAX(price_per_kg), ARRAY_AGG(DISTINCT order_id)
FROM transaction_lines
WHERE ... -- เงื่อนไข filter
GROUP BY category_id, sub_category_id, trade_type, grade;
```

## ลองดูข้อมูลเอง

```bash
docker compose exec mongo mongosh unii
> db.transaction_lines.countDocuments()
> db.transaction_lines.findOne()
> db.transaction_lines.aggregate([{ $group: { _id: "$tradeType", totalKg: { $sum: "$quantityKg" } } }])
```

หรือใช้ GUI [MongoDB Compass](https://www.mongodb.com/products/compass) ต่อที่ `mongodb://localhost:27017`
