import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SyncService } from './sync/sync.service';

// `npm run seed` — เติมข้อมูลลง MongoDB ครั้งแรก (ทำสิ่งเดียวกับ POST /sync แต่ไม่ต้องเปิดเซิร์ฟเวอร์)
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'log'] });
  const result = await app.get(SyncService).syncAll();
  console.log('seed เสร็จ:', result);
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
