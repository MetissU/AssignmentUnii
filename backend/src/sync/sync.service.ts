import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/category.schema';
import { TransactionLine } from '../transactions/transaction-line.schema';
import { normalizeCategories, normalizeOrders } from './normalize';
import { RawCategoryResponse, RawTransactionResponse } from './source-types';

const API_BASE = process.env.SOURCE_API_BASE ?? 'https://apirecycle.unii.co.th';

// ดึง JSON จากต้นทาง (ถ้า HTTP ผิดพลาดให้ error ชัดเจน)
async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`เรียก ${path} ไม่สำเร็จ: HTTP ${response.status}`);
  return (await response.json()) as T;
}

@Injectable()
export class SyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(TransactionLine.name) private readonly lineModel: Model<TransactionLine>,
  ) {}

  /** เปิดระบบครั้งแรก (DB ยังว่าง) + ตั้ง AUTO_SYNC=true → ดึงข้อมูลให้เลย (docker-compose ตั้งค่านี้ไว้) */
  async onApplicationBootstrap() {
    if (process.env.AUTO_SYNC !== 'true') return;
    if ((await this.lineModel.estimatedDocumentCount()) > 0) return;
    try {
      await this.syncAll();
    } catch (err) {
      this.logger.error(`auto-sync ไม่สำเร็จ (สั่ง POST /sync ซ้ำได้ภายหลัง): ${err}`);
    }
  }

  /** ขั้นตอนทั้งหมด: ดึงต้นทาง → แปลง → upsert ลง MongoDB (รันซ้ำได้ ข้อมูลไม่ซ้ำ) */
  async syncAll() {
    // 1) ดึงข้อมูลจาก 2 API ต้นทางพร้อมกัน
    const [rawCategories, rawTransactions] = await Promise.all([
      fetchJson<RawCategoryResponse>('/category/query-product-demo'),
      fetchJson<RawTransactionResponse>('/Stock/query-transaction-demo'),
    ]);

    // 2) แปลงเป็นรูปแบบที่เก็บใน DB
    const categories = normalizeCategories(rawCategories);
    const lines = [
      ...normalizeOrders(rawTransactions.buyTransaction, 'buy'),
      ...normalizeOrders(rawTransactions.sellTransaction, 'sell'),
    ];

    // 3) upsert: ถ้ามี key เดิมอยู่แล้วให้เขียนทับ ไม่มีก็เพิ่มใหม่
    await this.categoryModel.bulkWrite(
      categories.map((category) => ({
        updateOne: { filter: { categoryId: category.categoryId }, update: { $set: category }, upsert: true },
      })),
    );
    await this.lineModel.bulkWrite(
      lines.map((line) => ({
        updateOne: {
          // 4 ฟิลด์นี้ = unique key ของบรรทัด (ตรงกับ unique index ใน schema)
          filter: { orderId: line.orderId, tradeType: line.tradeType, subCategoryId: line.subCategoryId, grade: line.grade },
          update: { $set: line },
          upsert: true,
        },
      })),
    );

    const result = { categories: categories.length, transactionLines: lines.length };
    this.logger.log(`sync เสร็จ: ${JSON.stringify(result)}`);
    return result;
  }
}
