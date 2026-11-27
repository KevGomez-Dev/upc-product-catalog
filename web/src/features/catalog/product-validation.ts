import type {
  ErrorFields,
  ProductInput,
  Subcategory,
} from '../../lib/contracts';

export function validateProduct(
  input: ProductInput,
  subcategories: Subcategory[],
): ErrorFields {
  const errors: ErrorFields = {};
  if (input.upcCode.length !== 12 || !/^[0-9]{12}$/.test(input.upcCode))
    errors.upcCode = ['El UPC debe tener exactamente 12 dígitos ASCII.'];
  if (!input.upcDescription.trim())
    errors.upcDescription = ['Ingresa una descripción.'];
  if (!input.categoryCode) errors.categoryCode = ['Selecciona una categoría.'];
  if (!input.subCategoryCode)
    errors.subCategoryCode = ['Selecciona una subcategoría.'];
  else if (
    !subcategories.some(
      ({ code, categoryCode }) =>
        code === input.subCategoryCode && categoryCode === input.categoryCode,
    )
  ) {
    errors.subCategoryCode = [
      'Selecciona una subcategoría de la categoría actual.',
    ];
  }
  return errors;
}
