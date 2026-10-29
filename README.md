# ระบบสรุปยอดซื้อ–ขายรายสินค้า

โจทย์ Full-Stack ของ Unii Digital Group — ดึงข้อมูลออเดอร์และหมวดสินค้าจาก API ภายนอก เก็บลง **MongoDB** เปิด API ด้วย **NestJS** และแสดงตารางสรุป หมวดหมู่ → หมวดหมู่ย่อย (ซื้อ / ขาย / คงเหลือ) ด้วย **Next.js** พร้อม filter หลายตัว

| ส่วน (ตามโจทย์) | เทคโนโลยี | โฟลเดอร์ |
|---|---|---|
| 1. Database | MongoDB 7 | `docker-compose.yml` + schema ใน `backend/src/*/*.schema.ts` |
| 2. API | NestJS 11 + Mongoose | [`backend/`](backend) |
| 3. Frontend | Next.js (App Router) + TypeScript | [`frontend/`](frontend) |

สีธีม: primary `#4534f0`, secondary `#b42996`

## เริ่มใช้งาน

### วิธีที่ 1 — Docker (แนะนำ ใช้คำสั่งเดียว)

```bash
docker compose up --build
```

- หน้าเว็บ: http://localhost:3000
- API: http://localhost:3001/summary
- ถ้า port 3000 หรือ 3001 ถูกใช้อยู่ (เช่น มี container/โปรแกรมอื่นใช้อยู่): `WEB_PORT=8080 API_PORT=3002 docker compose up --build` แล้วเปิด http://localhost:8080 (API ที่ http://localhost:3002)
- ครั้งแรกที่เปิด ระบบจะดึงข้อมูลจาก API ต้นทางมาเก็บใน MongoDB ให้อัตโนมัติ (`AUTO_SYNC=true`)
- อยากดึงข้อมูลใหม่: `curl -X POST http://localhost:3001/sync`

### วิธีที่ 2 — รันแยกเอง (ต้องมี Node 22+ และ MongoDB)

```bash
# 1) MongoDB (ถ้ายังไม่มี)
docker run -d --name unii-mongo -p 27017:27017 mongo:7

# 2) Backend
cd backend
npm install
npm run seed          # ดึงข้อมูลลง MongoDB ครั้งแรก
npm run start:dev     # http://localhost:3001

# 3) Frontend (เปิดอีก terminal)
cd frontend
npm install
npm run dev           # http://localhost:3000
```

## ทดสอบ

```bash
cd backend && npm test
```

## เอกสาร

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/handover.md](docs/handover.md) | **เริ่มที่นี่** — คู่มือส่งต่อ: แผนที่โค้ด, หลักการออกแบบ, "อยากแก้ X แก้ที่ไหน" |
| [docs/flow.md](docs/flow.md) | ผัง flow ทั้งหมด (ภาพรวม, sync, request, ข้อมูล, หน้าเว็บ) |
| [docs/business-rules.md](docs/business-rules.md) | สูตรคำนวณ, กติกา filter, ข้อตกลงเรื่องข้อมูล |
| [docs/api.md](docs/api.md) | รายละเอียดทุก endpoint พร้อมตัวอย่าง |
| [docs/mongodb-primer.md](docs/mongodb-primer.md) | MongoDB สำหรับมือใหม่ + อธิบาย aggregation ที่ใช้ |

## โครงสร้างโฟลเดอร์

```
├─ backend/    NestJS   (sync/ categories/ transactions/ summary/)
├─ frontend/   Next.js  (หน้าเดียว: ฟอร์ม filter + ตาราง)
├─ docs/       เอกสาร
└─ docker-compose.yml
```
