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
├─ app/page.tsx                  หน้าเดียว: state หลัก + เรียก API + แถบด้านบน/footer (โลโก้)
├─ components/FilterForm.tsx     ฟอร์ม filter 4 กลุ่ม + ป้ายตัวกรองที่ใช้งาน + ปุ่มวันด่วน (ไม่เรียก API เอง)
├─ components/SummaryCards.tsx   การ์ดยอดรวม ซื้อ/ขาย/คงเหลือ + แถบสัดส่วนขาย/ซื้อ (ไม่มี state)
├─ components/SummaryTable.tsx   ตาราง + ค้นหาในตาราง + พับ/ขยายหมวด + ปุ่มส่งออก CSV
├─ components/OrderIdsModal.tsx  หน้าต่างดู/ค้นหา/คัดลอกเลขออเดอร์ของ 1 เซลล์
├─ components/SkeletonLoader.tsx โครงร่างระหว่างโหลดครั้งแรก
└─ lib/api.ts, types.ts, format.ts, exportCsv.ts  เรียก backend + ชนิดข้อมูล + จัดรูปตัวเลข + สร้างไฟล์ CSV
(โลโก้: frontend/public/unii-logo.png)
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
| เพิ่มคอลัมน์ในไฟล์ CSV | `sideHeaders()` + `sideValues()` ใน `frontend/src/lib/exportCsv.ts` (ลำดับต้องตรงกัน) |
| เปลี่ยนโลโก้ | แทนไฟล์ `frontend/public/unii-logo.png` (ชื่อเดิม) |
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

## 7. หน้าเว็บมีอะไรบ้าง

Dashboard หน้าเดียว ใช้สีธีมตามโจทย์ (`#4534f0` / `#b42996`) ฟอนต์ Noto Sans Thai และโลโก้ Unii ที่แถบด้านบนและ footer

| ส่วน | ทำอะไร | ไฟล์ |
|---|---|---|
| แถบด้านบน | โลโก้, เวลาที่โหลดล่าสุด, ปุ่มรีเฟรช (ค้นหาด้วยค่าในฟอร์มปัจจุบัน) | `page.tsx` |
| แผงตัวกรอง | 4 กลุ่ม (วันที่ / หมวดหมู่ / เลขออเดอร์ / ราคา+เกรด), ปุ่มวันด่วน วันนี้·7·30 วัน, ป้ายตัวกรองที่ใช้งาน กด ✕ เอาออกได้, พับ/ขยายแผงได้ | `FilterForm.tsx` |
| การ์ดสรุป | ซื้อรวม / ขายรวม / คงเหลือ พร้อมจำนวนออเดอร์ และแถบสัดส่วนขายเทียบซื้อ (%) | `SummaryCards.tsx` |
| ตาราง | หัว 2 แถว, คอลัมน์ชื่อและแถวรวมค้างไว้, พับ/ขยายรายหมวด, ค้นหาชื่อสินค้าในตาราง (กรองเฉพาะที่แสดง ไม่เรียก API), ค่า 0 จาง ค่าติดลบเด่น | `SummaryTable.tsx` |
| เลขออเดอร์ | กดตัวเลขในคอลัมน์เลขออเดอร์ → หน้าต่างแสดงรายการ ค้นหาและคัดลอกได้ (Esc หรือคลิกนอกกรอบเพื่อปิด) | `OrderIdsModal.tsx` |
| ส่งออก CSV | ดาวน์โหลดตารางตามผลค้นหาปัจจุบัน (UTF-8 BOM เปิดใน Excel ภาษาไทยได้) | `lib/exportCsv.ts` |
| สถานะ | โหลดครั้งแรก = โครงร่าง (skeleton), ค้นหาใหม่ = ตารางเดิมจางลง, ผิดพลาด = การ์ดแดงพร้อมปุ่มลองใหม่, ไม่พบข้อมูล = การ์ดแนะนำพร้อมปุ่มล้างตัวกรอง | `page.tsx`, `SkeletonLoader.tsx` |

- ป้ายตัวกรองแสดง "ค่าในฟอร์ม" ไม่ใช่ผลที่ค้นแล้ว: กด ✕ แล้วต้องกดค้นหาเพื่อดูผลใหม่ (ยกเว้นปุ่ม "ล้างทั้งหมด" ที่ค้นหาให้ทันที)
- ปุ่มวันด่วนคิดวันตามเวลาเครื่องผู้ใช้ (ไม่ใช้ UTC กันวันเลื่อนช่วงก่อน 07:00)
- ยังไม่มี dark mode และยังไม่รองรับ `prefers-reduced-motion`

## 8. ข้อจำกัดที่ทราบ (Known limitations)

- **ไม่มี pagination** — ข้อมูลตัวอย่างมีไม่กี่ร้อยบรรทัด ผลสรุปมีไม่เกินไม่กี่ร้อยแถว; ถ้าข้อมูลโตมาก ให้เพิ่ม pagination ที่ระดับหมวดหมู่
- **ไม่มี authentication** — โจทย์ไม่ได้ระบุ
- **Sync เป็นแบบ "เพิ่ม/อัปเดต" เท่านั้น** — ออเดอร์ที่ถูกลบที่ต้นทางจะไม่ถูกลบออกจาก DB
- **`total` ใช้ค่าจากต้นทาง** ซึ่งไม่เท่ากับ ราคา × กก. เสมอไปในข้อมูลตัวอย่าง (ดู business-rules.md)
- **ไม่มี test ระดับ end-to-end / component** — รวมถึงฟีเจอร์หน้าเว็บ (พับ/ขยาย, ค้นหาในตาราง, CSV, หน้าต่างออเดอร์) ตรวจด้วยมือเท่านั้น — มีเฉพาะ unit test ของ logic หลัก; การตรวจ aggregation กับ MongoDB จริงทำด้วยมือ (ดูตาราง "ตรวจความถูกต้องกับข้อมูลจริง" ใน README)
- **ฟอนต์ดาวน์โหลดตอน build** (`next/font/google`) — build frontend ครั้งแรกต้องออกอินเทอร์เน็ต
- เก็บเวลา `orderFinishedTime` ไม่ได้ใช้ (โจทย์ filter ระดับวัน)
