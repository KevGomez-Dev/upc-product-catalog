export type Role = 'admin' | 'manager';
export type Profile = { id: number; username: string; role: Role };
export type ProductInput = {
  upcCode: string;
  upcDescription: string;
  categoryCode: string;
  subCategoryCode: string;
};
export type Product = ProductInput & {
  id: number;
  dateAdded: string;
  updatedDate: string;
};
export type ProductDetail = Product & { addedBy: string; modifiedBy: string };
export type Category = { code: string };
export type Subcategory = Category & { categoryCode: string };
export type ErrorFields = Record<string, string[]>;
export type ErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
  fieldErrors?: ErrorFields;
};

export function isProductId(value: string): boolean {
  return (
    /^[0-9]+$/.test(value) && Number(value) >= 1 && Number(value) <= 2147483647
  );
}
