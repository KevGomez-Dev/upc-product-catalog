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
    // Lock the candidate before reading the edit clock and decide the outcome
    // in the same statement, including when no update is possible.
    const [row] = await this.products
      .query<
        Array<{ found: boolean; id: null } | (WrittenProduct & { found: true })>
      >(
        `
      WITH target AS MATERIALIZED (
        SELECT id, updated_date FROM products WHERE id = $1 FOR UPDATE
      ), edit_clock AS MATERIALIZED (
        SELECT date_trunc('second', clock_timestamp()) AS edited_at FROM target
      ), written AS (
        UPDATE products AS p
        SET upc_code = $2, upc_description = $3, subcategory_id = $4,
            modified_by = $5, updated_date = edit_clock.edited_at
        FROM target, edit_clock
        WHERE p.id = target.id AND target.updated_date <= edit_clock.edited_at
        RETURNING p.id, p.upc_code, p.upc_description, p.date_added,
                  p.updated_date, p.added_by, p.modified_by
      )
      SELECT (target.id IS NOT NULL) AS found, written.*
      FROM (SELECT 1) AS anchor LEFT JOIN target ON TRUE LEFT JOIN written ON TRUE
      `,
        [id, input.upcCode, input.upcDescription, subcategory.id, username],
      )
      .catch(handleProductWriteError);
    if (!row.found) throw notFound();
    if (row.id === null) {
      throw new ApiException(409, {
        code: 'AUDIT_DATE_CONFLICT',
        message:
          'La fecha histórica de modificación es posterior al reloj del servidor.',
      });
    }
    return writtenDetail(row, subcategory);
  }

  async delete(id: number): Promise<void> {
    const result = await this.products.delete(id);
    if (!result.affected) throw notFound();
  }
}
