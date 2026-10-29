import { Controller, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

// POST /sync — สั่งดึงข้อมูลจากต้นทางมาเก็บ (เรียกซ้ำได้ ข้อมูลไม่ซ้ำ)
@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post()
  run() {
    return this.sync.syncAll();
  }
}
