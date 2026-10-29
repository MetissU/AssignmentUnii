# Flow การทำงานของระบบ

เอกสารนี้อธิบาย "ข้อมูลไหลอย่างไร" ตั้งแต่ต้นทางจนถึงหน้าจอ แผนภาพเป็น [Mermaid](https://mermaid.js.org/) — เปิดอ่านบน GitHub/GitLab ได้ทันที

## 1) ภาพรวมระบบ

```mermaid
flowchart LR
    subgraph Source["API ต้นทาง (Unii)"]
        S1["/Stock/query-transaction-demo<br/>ออเดอร์ซื้อ + ขาย"]
        S2["/category/query-product-demo<br/>หมวดหมู่ + หมวดย่อย"]
    end

    subgraph Backend["Backend — NestJS (port 3001)"]
        SYNC["SyncModule<br/>POST /sync"]
        CAT["CategoriesModule<br/>GET /categories"]
        SUM["SummaryModule<br/>GET /summary"]
    end

    DB[("MongoDB<br/>categories<br/>transaction_lines")]

    subgraph Frontend["Frontend — Next.js (port 3000)"]
        UI["หน้าเดียว:<br/>ฟอร์ม filter + ตารางสรุป"]
    end

    S1 --> SYNC
    S2 --> SYNC
    SYNC -->|"upsert"| DB
    DB --> CAT
    DB --> SUM
    CAT -->|"dropdown"| UI
    SUM -->|"ตารางสรุป"| UI
```

หลักการสำคัญ: **ระบบอ่านข้อมูลจาก MongoDB เท่านั้น** ไม่เรียก API ต้นทางตอนผู้ใช้เปิดหน้าเว็บ API ต้นทางถูกเรียกเฉพาะตอน sync

## 2) Flow การนำเข้าข้อมูล (Sync)

เกิดขึ้นเมื่อ: (ก) `POST /sync` (ข) `npm run seed` (ค) เปิด API ครั้งแรกใน docker-compose (`AUTO_SYNC=true` และ DB ว่าง)

```mermaid
sequenceDiagram
    participant T as ผู้สั่ง (curl / seed / auto)
    participant S as SyncService
    participant U as API ต้นทาง
    participant N as normalize.ts
    participant D as MongoDB

    T->>S: syncAll()
    par ดึงพร้อมกัน
        S->>U: GET /category/query-product-demo
        S->>U: GET /Stock/query-transaction-demo
    end
    U-->>S: JSON ดิบ
    S->>N: normalizeCategories() / normalizeOrders()
    Note over N: • quantity "25" → 25<br/>• แตก order → บรรทัด (หมวดย่อย × เกรด)<br/>• ข้ามเกรดที่ quantity = 0<br/>• วันที่ → Date (00:00 UTC)
    N-->>S: categories[], transaction_lines[]
    S->>D: bulkWrite upsert (key ไม่ซ้ำ)
    S-->>T: { categories, transactionLines }
```

**Idempotent:** สั่ง sync กี่ครั้งก็ได้ ข้อมูลไม่ซ้ำ เพราะ upsert ด้วย key `(orderId, type, subCategoryId, grade)`

## 3) Flow การค้นหา/สรุปยอด (Request)

```mermaid
sequenceDiagram
    participant W as หน้าเว็บ (page.tsx)
    participant C as SummaryController
    participant V as ValidationPipe + DTO
    participant Sv as SummaryService
    participant M as buildMatch()
    participant D as MongoDB
    participant B as buildSummary()

    W->>C: GET /summary?grade=A,B&dateFrom=...
    C->>V: ตรวจ/แปลง query (ผิดรูปแบบ → 400)
    V->>Sv: SummaryQueryDto
    Sv->>M: filter → เงื่อนไข $match
    Sv->>D: aggregate [$match, $group]
    D-->>Sv: แถวสรุป (หมวดย่อย × ซื้อ/ขาย × เกรด)
    Sv->>D: find categories (ชื่อ + ลำดับ)
    Sv->>B: ประกอบต้นไม้ + คำนวณคงเหลือ
    B-->>W: { categories[], total }
```

## 4) โครงสร้างข้อมูลใน MongoDB

```mermaid
erDiagram
    categories {
        string categoryId PK "เช่น 01"
        string categoryName
        array subCategories "ฝังใน document: {subCategoryId, subCategoryName}"
    }
    transaction_lines {
        string orderId "UK ร่วม 4 ฟิลด์"
        string type "buy | sell"
        string categoryId FK
        string subCategoryId FK
        string grade "A B C D"
        number price "บาท/กก."
        number quantityKg "กก."
        number total "บาท"
        date orderFinishedDate
    }
    categories ||--o{ transaction_lines : "categoryId / subCategoryId"
```

ตัวอย่าง: ออเดอร์ 1 ใบที่มี 2 หมวดย่อย หมวดละ 2 เกรด จะกลายเป็น **4 documents** ใน `transaction_lines`

## 5) Flow ฝั่งหน้าเว็บ

```mermaid
flowchart TD
    A[เปิดหน้า] --> B["โหลด /categories (dropdown)<br/>+ /summary ไม่มี filter"]
    B --> C[แสดงตาราง]
    C --> D{ผู้ใช้แก้ฟอร์ม}
    D -->|เปลี่ยนหมวดหมู่| E["ล้างหมวดย่อย<br/>และแสดงเฉพาะหมวดย่อยของหมวดนั้น"]
    D -->|กดค้นหา| F["แปลงค่าฟอร์ม → query string<br/>เรียก /summary"]
    D -->|ล้างตัวกรอง| G["ค่าว่างทั้งหมด → เรียก /summary"]
    E --> D
    F --> C
    G --> C
    F -->|error| H[แสดงข้อความผิดพลาด]
    F -->|ไม่มีผล| I["แสดง 'ไม่พบข้อมูล'"]
```
