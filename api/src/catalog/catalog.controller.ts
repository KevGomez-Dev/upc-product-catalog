import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators';
import { CatalogService } from './catalog.service';
import { CategoryParamsDto } from './classification.dto';

@Controller('categories')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @Roles('admin', 'manager')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get(':categoryCode/subcategories')
  @Roles('admin', 'manager')
  listSubcategories(@Param() { categoryCode }: CategoryParamsDto) {
    return this.catalog.listSubcategories(categoryCode);
  }
}
