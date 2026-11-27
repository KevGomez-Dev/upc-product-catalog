import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { Subcategory } from '../database/entities/subcategory.entity';
import { ApiException } from '../http/api-errors';
import type { ClassificationDto } from './classification.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategories: Repository<Subcategory>,
  ) {}

  async listCategories() {
    const categories = await this.categories.find({ order: { code: 'ASC' } });
    return categories.map(({ code }) => ({ code }));
  }

  async listSubcategories(categoryCode: string) {
    if (!(await this.categories.existsBy({ code: categoryCode }))) {
      throw new ApiException(404, {
        code: 'CATEGORY_NOT_FOUND',
        message: 'La categoría no existe.',
      });
    }
    const subcategories = await this.subcategories.find({
      where: { categoryCode },
      order: { code: 'ASC' },
    });
    return subcategories.map(({ code, categoryCode }) => ({
      code,
      categoryCode,
    }));
  }

  async resolveSubcategory({
    categoryCode,
    subCategoryCode,
  }: ClassificationDto): Promise<Subcategory> {
    const subcategory = await this.subcategories.findOneBy({
      categoryCode,
      code: subCategoryCode,
    });
    if (subcategory) return subcategory;

    const categoryExists = await this.categories.existsBy({
      code: categoryCode,
    });
    if (!categoryExists) {
      throw new ApiException(400, {
        code: 'INVALID_CLASSIFICATION',
        message: 'La clasificación no es válida.',
        fieldErrors: { categoryCode: ['La categoría no existe.'] },
      });
    }
    const subcategoryExists = await this.subcategories.existsBy({
      code: subCategoryCode,
    });
    throw new ApiException(400, {
      code: 'INVALID_CLASSIFICATION',
      message: 'La clasificación no es válida.',
      fieldErrors: {
        subCategoryCode: [
          subcategoryExists
            ? 'La subcategoría no pertenece a la categoría indicada.'
            : 'La subcategoría no existe.',
        ],
      },
    });
  }
}
