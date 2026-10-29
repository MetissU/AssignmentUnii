import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './category.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [CategoriesController],
  exports: [MongooseModule], // ให้ module อื่น (sync, summary) ใช้ model Category ได้
})
export class CategoriesModule {}
