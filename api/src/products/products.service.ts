import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, type Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.identity';
import { AuthService } from '../auth/auth.service';
import { CatalogService } from '../catalog/catalog.service';
import { Product } from '../database/entities/product.entity';
import type { Subcategory } from '../database/entities/subcategory.entity';
import { ApiException } from '../http/api-errors';
import type { ProductFilterDto, ProductWriteDto } from './product.dto';
import { productDetail, productSummary } from './product.view';

interface WrittenProduct {
  id: number;
  upc_code: string;
  upc_description: string;
  date_added: Date;
  updated_date: Date;
  added_by: string;
  modified_by: string;
}

const returnedFields = [
  'id',
  'upcCode',
  'upcDescription',
  'dateAdded',
  'updatedDate',
  'addedBy',
  'modifiedBy',
];

function databaseTime(): string {
  return "date_trunc('second', statement_timestamp())";
}

function notFound(): ApiException {
  return new ApiException(404, {
    code: 'PRODUCT_NOT_FOUND',
    message: 'El producto no existe.',
  });
}

function writtenDetail(row: WrittenProduct, subcategory: Subcategory) {
  return productDetail(
    {
      id: row.id,
      upcCode: row.upc_code,
      upcDescription: row.upc_description,
      dateAdded: row.date_added,
      updatedDate: row.updated_date,
      addedBy: row.added_by,
      modifiedBy: row.modified_by,
    },
    subcategory,
  );
}

export function handleProductWriteError(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const cause: Error & { code?: string; constraint?: string } =
      error.driverError;
    if (cause.code === '23505' && cause.constraint === 'uq_products_upc_code') {
      throw new ApiException(409, {
        code: 'UPC_CONFLICT',
        message: 'El UPC ya existe en el catálogo.',
        fieldErrors: {
          upcCode: ['Usa un UPC que no esté asignado a otro producto.'],
        },
      });
    }
  }
  throw error;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly catalog: CatalogService,
    private readonly auth: AuthService,
  ) {}

  async list({ categoryCode, subCategoryCode }: ProductFilterDto) {
    const query = this.products
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.subcategory', 'subcategory')
      .orderBy('product.id', 'ASC');

    if (categoryCode !== undefined && subCategoryCode !== undefined) {
      const subcategory = await this.catalog.resolveSubcategory({
        categoryCode,
        subCategoryCode,
      });
      query.where('product.subcategoryId = :subcategoryId', {
        subcategoryId: subcategory.id,
      });
    }

    const rows = await query.getMany();
    return rows.map((product) => productSummary(product, product.subcategory));
  }

  async detail(id: number) {
    const product = await this.products.findOne({
      where: { id },
      relations: { subcategory: true },
    });
    if (!product) throw notFound();
    return productDetail(product, product.subcategory);
  }

  async create(input: ProductWriteDto, actor: AuthenticatedUser) {
    const subcategory = await this.catalog.resolveSubcategory(input);
    const { username } = await this.auth.me(actor);
    const result = await this.products
      .createQueryBuilder()
      .insert()
      .values({
        upcCode: input.upcCode,
        upcDescription: input.upcDescription,
        subcategoryId: subcategory.id,
        dateAdded: databaseTime,
        updatedDate: databaseTime,
        addedBy: username,
        modifiedBy: username,
      })
      .returning(returnedFields)
      .execute()
      .catch(handleProductWriteError);
    const [row] = result.raw as WrittenProduct[];
    return writtenDetail(row, subcategory);
  }

  async update(id: number, input: ProductWriteDto, actor: AuthenticatedUser) {
    const subcategory = await this.catalog.resolveSubcategory(input);
    const { username } = await this.auth.me(actor);
    const result = await this.products
      .createQueryBuilder()
      .update()
      .set({
        upcCode: input.upcCode,
        upcDescription: input.upcDescription,
        subcategoryId: subcategory.id,
        updatedDate: () => `GREATEST("updated_date", ${databaseTime()})`,
        modifiedBy: username,
      })
      .where({ id })
      .returning(returnedFields)
      .execute()
      .catch(handleProductWriteError);
    const [row] = result.raw as WrittenProduct[];
    if (!row) throw notFound();
    return writtenDetail(row, subcategory);
  }

  async delete(id: number): Promise<void> {
    const result = await this.products.delete(id);
    if (!result.affected) throw notFound();
  }
}
