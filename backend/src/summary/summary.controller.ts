import { Controller, Get, Query } from '@nestjs/common';
import { SummaryQueryDto } from './summary-query.dto';
import { SummaryService } from './summary.service';

// GET /summary?dateFrom=&dateTo=&categoryId=&subCategoryId=&orderId=&orderIdMode=&priceMin=&priceMax=&grade=A,B
@Controller('summary')
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Get()
  get(@Query() query: SummaryQueryDto) {
    return this.summary.getSummary(query);
  }
}
