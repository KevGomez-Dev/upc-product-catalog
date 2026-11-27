import type { Product } from '../database/entities/product.entity';
import type { Subcategory } from '../database/entities/subcategory.entity';

type ProductFields = Pick<
  Product,
  | 'id'
  | 'upcCode'
  | 'upcDescription'
  | 'dateAdded'
  | 'updatedDate'
  | 'addedBy'
  | 'modifiedBy'
>;
type SummaryFields = Omit<ProductFields, 'addedBy' | 'modifiedBy'>;
type ClassificationFields = Pick<Subcategory, 'code' | 'categoryCode'>;

export function productSummary(
  product: SummaryFields,
  subcategory: ClassificationFields,
) {
  return {
    id: product.id,
    upcCode: product.upcCode,
    upcDescription: product.upcDescription,
    categoryCode: subcategory.categoryCode,
    subCategoryCode: subcategory.code,
    dateAdded: product.dateAdded.toISOString().replace('.000Z', 'Z'),
    updatedDate: product.updatedDate.toISOString().replace('.000Z', 'Z'),
  };
}

export function productDetail(
  product: ProductFields,
  subcategory: ClassificationFields,
) {
  return {
    ...productSummary(product, subcategory),
    addedBy: product.addedBy,
    modifiedBy: product.modifiedBy,
  };
}
