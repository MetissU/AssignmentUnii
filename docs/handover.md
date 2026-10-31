# คู่มือส่งต่องาน (Handover)

สำหรับ developer ที่รับช่วงต่อ — อ่านไฟล์นี้ก่อนแล้วค่อยเปิดโค้ด

## 1. ระบบนี้ทำอะไร (30 วินาที)

ดึงออเดอร์ซื้อ/ขายและหมวดสินค้าจาก API ของ Unii → เก็บลง MongoDB → NestJS ให้ `GET /summary` → Next.js แสดงตารางสรุป **หมวดหมู่ → หมวดย่อย** พร้อมซื้อ/ขาย/คงเหลือ และ filter 7 แบบ

อ่านต่อ: [flow.md](flow.md) (ผัง) · [data-dictionary.md](data-dictionary.md) (ความหมายทุกฟิลด์) · [business-rules.md](business-rules.md) (สูตร) · [api.md](api.md)

## 2. แผนที่โค้ด

```
backend/src/
├─ main.ts, app.module.ts        ทางเข้า + ประกอบ module + เชื่อม MongoDB
├─ seed.ts                       npm run seed (เรียก SyncService เหมือน POST /sync)
├─ categories/                   schema Category + GET /categories
├─ transactions/                 schema TransactionLine (collection transaction_lines)
├─ sync/
│  ├─ source-types.ts            ชนิดข้อมูลดิบจาก API ต้นทาง
│  ├─ normalize.ts  (+spec)      ★ แปลงข้อมูลต้นทาง → รูปแบบใน DB  (ฟังก์ชันบริสุทธิ์)
│  ├─ sync.service.ts            ดึง → normalize → upsert
│  └─ sync.controller.ts         POST /sync
└─ summary/
   ├─ summary-query.dto.ts       พารามิเตอร์ + การตรวจ (class-validator)
   ├─ summary.types.ts           ชนิดข้อมูลของ response
   ├─ build-match.ts (+spec)     ★ filter → เงื่อนไข MongoDB $match
   ├─ summary.service.ts         aggregate 2 ขั้น ($match, $group)
   ├─ build-summary.ts (+spec)   ★ แถว aggregate → ต้นไม้ หมวด→หมวดย่อย + คงเหลือ
   └─ summary.controller.ts      GET /summary

frontend/src/
├─ app/page.tsx                  หน้าเดียว: state + เรียก API
├─ components/FilterForm.tsx     ฟอร์ม filter 4 กลุ่ม (ไม่เรียก API เอง)
├─ components/SummaryCards.tsx   การ์ดยอดรวม ซื้อ/ขาย/คงเหลือ (ไม่มี state)
├─ components/SummaryTable.tsx   ตาราง (ไม่มี state)
└─ lib/api.ts, types.ts, format.ts  เรียก backend + ชนิดข้อมูล + จัดรูปแบบตัวเลข
```

★ = ที่เก็บ logic ที่สำคัญ และมี unit test ครอบคลุม — **แยกเป็นฟังก์ชันบริสุทธิ์ตั้งใจ** เพื่อให้เทสและอ่านง่ายโดยไม่ต้องมี DB

## 3. หลักการออกแบบ (ทำไมโค้ดหน้าตาแบบนี้)

1. **อ่านจาก MongoDB เท่านั้น** ไม่เรียก API ต้นทางตอนใช้งาน → เร็ว และไม่พังเมื่อต้นทางล่ม
2. **เก็บเป็น "บรรทัดสินค้า" แบบแบน** (ออเดอร์ × หมวดย่อย × เกรด) → filter และรวมยอดง่าย
3. **Mongo ทำแค่ กรอง + รวมยอด** ส่วนการจัดกลุ่มเป็นต้นไม้/คำนวณคงเหลืออยู่ใน TypeScript (`build-summary.ts`) → อ่านง่าย เทสง่าย
4. **Sync เป็น idempotent** (upsert ด้วย unique index) → รันซ้ำได้
5. ไม่มี library เกินจำเป็น: ไม่มี state manager, UI kit, ORM ชั้นที่สอง

## 4. รันและทดสอบ

ดู [README](../README.md) สำหรับคำสั่งรัน ส่วนการทดสอบ:

```bash
cd backend && npm test        # unit test ของ normalize / buildMatch / buildSummary
```

ตรวจผลกับข้อมูลจริงด้วยตาราง "ตรวจความถูกต้องกับข้อมูลจริง" ใน README

## 5. "อยากแก้ X ต้องแก้ที่ไหน"

| โจทย์เปลี่ยน | แก้ที่ |
|---|---|
| เพิ่ม filter ใหม่ | `summary-query.dto.ts` (เพิ่มฟิลด์) → `build-match.ts` (เพิ่มเงื่อนไข + test) → `lib/types.ts` + `lib/api.ts` (`toQuery`) → `FilterForm.tsx` |
| เพิ่มคอลัมน์ในตาราง | `summary.service.ts` ($group) + `summary.types.ts` + `build-summary.ts` → `SummaryTable.tsx` + `lib/types.ts` (+ เพิ่มใน `data-dictionary.md`) |
| เพิ่ม/เปลี่ยนชื่อฟิลด์ | ทำตามกติกาการตั้งชื่อใน `data-dictionary.md` แล้วแก้ทั้ง backend, frontend และเอกสารในคราวเดียว |
| เปลี่ยนสูตรคงเหลือ | `buildSummaryRow()` ใน `build-summary.ts` (+ แก้ `business-rules.md`) |
| ต้นทางเปลี่ยนรูปแบบ JSON | `sync/source-types.ts` + `sync/normalize.ts` |
| เปลี่ยนสีธีม/ระยะ | ตัวแปร CSS (design tokens) ที่หัวไฟล์ `frontend/src/app/globals.css` (`--primary`, `--secondary` …) |
| เปลี่ยนฟอนต์ | `frontend/src/app/layout.tsx` (Noto Sans Thai ผ่าน `next/font/google`) |
| เปลี่ยนที่อยู่ API | env `NEXT_PUBLIC_API_URL` (frontend), `SOURCE_API_BASE` (backend ต้นทาง) |

## 6. Environment variables

| ตัวแปร | ที่ | ค่าเริ่มต้น | ความหมาย |
|---|---|---|---|
| `MONGO_URI` | backend | `mongodb://localhost:27017/unii` | การเชื่อมต่อ MongoDB |
| `PORT` | backend | `3001` | |
| `WEB_ORIGIN` | backend | `http://localhost:3000` | origin ที่อนุญาตให้เรียก API (CORS) |
| `AUTO_SYNC` | backend | (ปิด) | `true` = เปิดระบบแล้ว DB ว่าง → sync ให้เอง |
| `SOURCE_API_BASE` | backend | `https://apirecycle.unii.co.th` | API ต้นทาง |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:3001` | API ที่เบราว์เซอร์เรียก (ฝังตอน build) |

## 7. แนวทางออกแบบ UI

สไตล์ Minimalism แบบ dashboard ใช้สีธีมตามโจทย์ (`#4534f0` / `#b42996`) และฟอนต์ Noto Sans Thai

- ฟอร์ม filter แบ่ง 4 กลุ่ม ทุกช่องมี label ที่มองเห็น; เกรดเป็นปุ่มกดเลือกหลายเกรด (ใช้ checkbox จริงข้างใต้)
- การ์ดยอดรวม 3 ใบ อ่านภาพรวมก่อนลงตาราง
- ตารางเลื่อนในกรอบของตัวเอง: หัวตาราง 2 แถว, คอลัมน์ชื่อ และแถวรวมทั้งหมดจะค้างไว้; ค่า 0 จาง, ค่าติดลบเป็นสีแดง; ตัวเลขใช้ตัวเลขแบบความกว้างเท่ากัน (tabular)
- ระหว่างค้นหาใหม่ ตารางเดิมจางลงแทนที่จะหายไป (หน้าไม่กระโดด)
- ปุ่ม/ช่องกรอกสูงอย่างน้อย 44px, มี focus ring, เคารพ `prefers-reduced-motion`
- ยังไม่มี dark mode

## 8. ข้อจำกัดที่ทราบ (Known limitations)

- **ไม่มี pagination** — ข้อมูลตัวอย่างมีไม่กี่ร้อยบรรทัด ผลสรุปมีไม่เกินไม่กี่ร้อยแถว; ถ้าข้อมูลโตมาก ให้เพิ่ม pagination ที่ระดับหมวดหมู่
- **ไม่มี authentication** — โจทย์ไม่ได้ระบุ
- **Sync เป็นแบบ "เพิ่ม/อัปเดต" เท่านั้น** — ออเดอร์ที่ถูกลบที่ต้นทางจะไม่ถูกลบออกจาก DB
- **`total` ใช้ค่าจากต้นทาง** ซึ่งไม่เท่ากับ ราคา × กก. เสมอไปในข้อมูลตัวอย่าง (ดู business-rules.md)
- **ไม่มี test ระดับ end-to-end / component** — มีเฉพาะ unit test ของ logic หลัก; การตรวจ aggregation กับ MongoDB จริงทำด้วยมือ (ดูตาราง "ตรวจความถูกต้องกับข้อมูลจริง" ใน README)
- **ฟอนต์ดาวน์โหลดตอน build** (`next/font/google`) — build frontend ครั้งแรกต้องออกอินเทอร์เน็ต
- เก็บเวลา `orderFinishedTime` ไม่ได้ใช้ (โจทย์ filter ระดับวัน)
