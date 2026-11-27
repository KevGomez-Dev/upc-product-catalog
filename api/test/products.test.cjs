require('reflect-metadata');
const { QueryFailedError } = require('typeorm');
const { isUpc, hasValidUpcCheckDigit } = require('../dist/catalog/upc.js');
const {
  productSummary,
  productDetail,
} = require('../dist/products/product.view.js');
const {
  handleProductWriteError,
} = require('../dist/products/products.service.js');

test('la regla UPC compartida conserva ceros y rechaza valores no ASCII o con espacios', () => {
  expect(isUpc('010433218194')).toBe(true);
  for (const value of [
    10433218194,
    '10433218194',
    '010433218194\n',
    ' 010433218194',
    '０10433218194',
  ]) {
    expect(isUpc(value)).toBe(false);
  }
  expect(hasValidUpcCheckDigit('012345678905')).toBe(true);
  expect(hasValidUpcCheckDigit('012345678906')).toBe(false);
});

test('el mapeo serializa UTC sin milisegundos y separa listado y detalle', () => {
  const item = {
    id: 1,
    upcCode: '010433218194',
    upcDescription: 'Agua',
    importRowId: 10,
    dateAdded: new Date('2026-01-15T14:30:00Z'),
    updatedDate: new Date('2026-01-16T15:31:00Z'),
    addedBy: 'historical',
    modifiedBy: 'admin@prueba.local',
  };
  const classInfo = { categoryCode: 'BEB', code: 'BEB-AGU', id: 77 };
  const summary = {
    id: 1,
    upcCode: '010433218194',
    upcDescription: 'Agua',
    categoryCode: 'BEB',
    subCategoryCode: 'BEB-AGU',
    dateAdded: '2026-01-15T14:30:00Z',
    updatedDate: '2026-01-16T15:31:00Z',
  };
  expect(productSummary(item, classInfo)).toEqual(summary);
  expect(productDetail(item, classInfo)).toEqual({
    ...summary,
    addedBy: 'historical',
    modifiedBy: 'admin@prueba.local',
  });
});

test('solo la violación UNIQUE del UPC se traduce a 409', () => {
  const failure = (code, constraint) =>
    new QueryFailedError(
      'fixture SQL',
      [],
      Object.assign(new Error('fixture error'), { code, constraint }),
    );
  expect(() =>
    handleProductWriteError(failure('23505', 'uq_products_upc_code')),
  ).toThrow(
    expect.objectContaining({
      status: 409,
      details: expect.objectContaining({ code: 'UPC_CONFLICT' }),
    }),
  );
  for (const error of [
    failure('23505', 'uq_products_import_row_id'),
    failure('23503', 'fk_products_subcategory'),
    new Error('unrelated error'),
  ]) {
    let received;
    try {
      handleProductWriteError(error);
    } catch (caught) {
      received = caught;
    }
    expect(received).toBe(error);
  }
});
