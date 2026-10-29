import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// หมวดหมู่ย่อย (ฝังอยู่ใน Category — ไม่ต้องแยก collection เพราะมีข้อมูลน้อยและอ่านพร้อมกันเสมอ)
export class SubCategory {
  @Prop({ required: true }) subCategoryId: string; // เช่น "0101"
  @Prop({ required: true }) subCategoryName: string;
}

// collection: categories — 1 document = 1 หมวดหมู่หลัก
@Schema({ collection: 'categories' })
export class Category {
  @Prop({ required: true, unique: true }) categoryId: string; // เช่น "01"
  @Prop({ required: true }) categoryName: string;
  @Prop({ type: [{ subCategoryId: String, subCategoryName: String, _id: false }], default: [] })
  subCategories: SubCategory[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
