import { Transform, Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsIn, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { GRADES, Grade } from '../transactions/transaction-line.schema';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// พารามิเตอร์ของ GET /summary — ทุกตัวเป็น optional และใช้ร่วมกันได้ (AND)
export class SummaryQueryDto {
  /** วันที่ orderFinishedDate เริ่มต้น (รวมวันนี้) รูปแบบ YYYY-MM-DD */
  @IsOptional() @Matches(DATE_FORMAT, { message: 'dateFrom ต้องเป็น YYYY-MM-DD' })
  dateFrom?: string;

  /** วันที่สิ้นสุด (รวมวันนี้) */
  @IsOptional() @Matches(DATE_FORMAT, { message: 'dateTo ต้องเป็น YYYY-MM-DD' })
  dateTo?: string;

  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subCategoryId?: string;

  /** เลขออเดอร์ที่ค้นหา */
  @IsOptional() @IsString() orderId?: string;

  /** exact = ตรงทั้งหมด (ค่าเริ่มต้น), contains = มีข้อความนี้อยู่ในเลขออเดอร์ */
  @IsOptional() @IsIn(['exact', 'contains']) orderIdMode?: 'exact' | 'contains';

  /** ช่วงราคาต่อ กก. (บาท) */
  @IsOptional() @Type(() => Number) @IsNumber() priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMax?: number;

  /** เกรด ส่งเป็น "A,B" → แปลงเป็น ['A','B'] */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @IsArray() @ArrayUnique() @IsIn(GRADES, { each: true })
  grade?: Grade[];
}
