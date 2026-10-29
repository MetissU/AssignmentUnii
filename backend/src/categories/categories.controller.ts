import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './category.schema';

// GET /categories — ให้หน้าเว็บเอาไปเติม dropdown (หมวดหมู่ → หมวดหมู่ย่อย)
@Controller('categories')
export class CategoriesController {
  constructor(@InjectModel(Category.name) private readonly model: Model<Category>) {}

  @Get()
  list() {
    return this.model.find({}, { _id: 0, __v: 0 }).sort({ categoryId: 1 }).lean();
  }
}
