import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ตรวจและแปลง query/body ตาม DTO อัตโนมัติ (ส่งค่าผิดรูปแบบ → HTTP 400 พร้อมข้อความ)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // อนุญาตให้หน้าเว็บ (คนละ port) เรียก API ได้
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API พร้อมใช้งานที่ http://localhost:${port}`);
}

bootstrap();
