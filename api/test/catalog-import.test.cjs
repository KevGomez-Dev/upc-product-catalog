const { Buffer } = require('node:buffer');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { readCatalogCsv } = require('../dist/catalog/import/read-csv.js');
const {
  inspectCatalog,
  reviewCatalog,
} = require('../dist/catalog/import/review-catalog.js');

const source = readFileSync(resolve(__dirname, '../../data/productos.csv'));
const reviewed = reviewCatalog(source);
const rowAt = (line) =>
  reviewed.rows.find(({ lineStart }) => lineStart === line);
const header = source.toString('utf8').split(/\r?\n/)[0];
const dates = '2026-03-10T15:20:00Z,2026-04-02T18:45:00Z';

test('CSV con BOM, CRLF, coma, comillas escapadas y nueva línea dentro de una descripción', () => {
  const record = `1,"Té, ""frío""\r\nsin azúcar",010433218194,BEB,BEB-AGU,${dates},ana,ana`;
  const extra =
    '2,descripción, adicional,010433218194,BEB,BEB-AGU,' + dates + ',ana,ana';
  const rows = readCatalogCsv(
    Buffer.from(`\uFEFF${header}\r\n${record}\r\n${extra}\r\n\r\n`),
  ).rows;
  expect(rows.map(({ lineStart, lineEnd }) => [lineStart, lineEnd])).toEqual([
    [2, 3],
    [4, 4],
    [5, 5],
  ]);
  expect(rows[0].rawRecord).toBe(record);
  expect(rows[0].sourceFields[1]).toBe('Té, "frío"\r\nsin azúcar');
  expect(rows[1].rawRecord).toBe(extra);
  expect(rows[1].sourceFields).toHaveLength(10);
  expect(rows[2].rawRecord).toBe('');
  expect(rowAt(116)).toMatchObject({
    originalId: '118',
    diagnostics: [{ code: 'COLUMN_COUNT' }],
  });
});

test('rechaza un encabezado distinto, UTF-8 inválido o comillas sin cerrar', () => {
  expect(() => readCatalogCsv(Buffer.from('Id,Column\n1,text'))).toThrow(
    /encabezado/,
  );
  expect(() => readCatalogCsv(Buffer.from([0xff]))).toThrow();
  expect(() => readCatalogCsv(Buffer.from(`${header}\n1,"incompleta`))).toThrow(
    /quote/i,
  );
});

test('preserva el cero inicial y excluye UPC corto, científico, alfanumérico y no ASCII', () => {
  expect(rowAt(24).product.upcCode).toBe('010433218194');
  for (const line of [32, 39, 45]) {
    expect(rowAt(line).product).toBeUndefined();
    expect(rowAt(line).diagnostics).toContainEqual(
      expect.objectContaining({ code: 'INVALID_UPC' }),
    );
  }
  const bad = reviewCatalog(
    Buffer.from(
      `${header}\n1,Una bebida,０１０４３３２１８１９４,BEB,BEB-AGU,${dates},ana,ana`,
    ),
  );
  expect(bad.rows[0].diagnostics).toContainEqual(
    expect.objectContaining({ code: 'INVALID_UPC' }),
  );
});

test('preserva descripciones con coma y comillas y el checksum queda como aviso', () => {
  expect(rowAt(67).product.upcDescription).toBe(
    'Galletas de Avena, Pasas y Miel 300g',
  );
  expect(rowAt(72).product.upcDescription).toBe(
    'Agua "Premium" Alcalina 600ml',
  );
  expect(rowAt(49).product.upcCode).toBe('600133890832');
  expect(rowAt(49).diagnostics).toEqual([
    { code: 'UPC_CHECKSUM', field: 'UpcCode', severity: 'warning' },
  ]);
});

test('registra recorte de UPC y normaliza letras solo para una pareja observada', () => {
  expect(rowAt(54).normalizations).toEqual([
    { field: 'UpcCode', before: ' 863794026546 ', after: '863794026546' },
  ]);
  expect(rowAt(62).normalizations).toEqual([
    { field: 'CategoryCode', before: 'lac', after: 'LAC' },
    { field: 'SubCategoryCode', before: 'lac-yog', after: 'LAC-YOG' },
  ]);
  const lowerOnly = reviewCatalog(
    Buffer.from(
      `${header}\n1,Una bebida,010433218194,beb,beb-agu,${dates},ana,ana`,
    ),
  );
  expect(lowerOnly.rows[0].normalizations).toEqual([]);
  expect(lowerOnly.rows[0].product).toBeUndefined();
});

test('acepta parejas únicas sin prefijo y deja pendientes las parejas sin dueño inequívoco', () => {
  const records = [
    `1,Bebida,010433218194,BEBIDAS,AGUA,${dates},ana,ana`,
    `2,Jugo,795106933306,BEBIDAS,FRUTA,${dates},ana,ana`,
    `3,Naranja,600133890832,ALIMENTOS,FRUTA,${dates},ana,ana`,
  ];
  const { rows } = reviewCatalog(Buffer.from([header, ...records].join('\n')));
  expect(rows[0].product).toMatchObject({
    categoryCode: 'BEBIDAS',
    subcategoryCode: 'AGUA',
  });
  for (const row of rows.slice(1)) {
    expect(row.product).toBeUndefined();
    expect(row.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'CLASSIFICATION_MISMATCH' }),
    );
  }
});

test('vincula duplicados exactos y conserva productos con el mismo ID de origen', () => {
  expect(rowAt(17).duplicateOfLine).toBe(3);
  expect(rowAt(17).product).toBeUndefined();
  expect(rowAt(59).originalId).toBe('50');
  expect(rowAt(96).originalId).toBe('50');
  expect(rowAt(59).product.upcCode).not.toBe(rowAt(96).product.upcCode);
});

test('deja pendientes las dos alternativas para un UPC con valores diferentes', () => {
  for (const [line, other] of [
    [10, 11],
    [11, 10],
  ]) {
    expect(rowAt(line).product).toBeUndefined();
    expect(rowAt(line).diagnostics).toContainEqual({
      code: 'SOURCE_UPC_CONFLICT',
      field: 'UpcCode',
      severity: 'error',
      relatedLines: [other],
    });
  }
});

test('rechaza clasificaciones inconsistentes o incompletas, fechas inválidas y descripción vacía', () => {
  for (const [line, code, field] of [
    [76, 'REQUIRED', 'UpcDescription'],
    [81, 'CLASSIFICATION_MISMATCH', 'SubCategoryCode'],
    [86, 'REQUIRED', 'CategoryCode'],
    [91, 'REQUIRED', 'SubCategoryCode'],
    [101, 'INVALID_DATE', 'DateAdded'],
    [106, 'INVALID_DATE', 'DateAdded'],
    [111, 'DATE_ORDER', 'UpdatedDate'],
  ]) {
    expect(rowAt(line).product).toBeUndefined();
    expect(rowAt(line).diagnostics).toContainEqual({
      code,
      field,
      severity: 'error',
    });
  }
});

test('la proyección en memoria es determinista y cuadra con la auditoría aprobada', () => {
  expect(reviewCatalog(source)).toEqual(reviewed);
  expect(inspectCatalog(reviewed)).toEqual({
    rows: 120,
    products: 106,
    duplicates: 1,
    pending: 13,
    categories: 5,
    subcategories: 17,
    warnings: 1,
    normalizations: 3,
    users: 0,
  });
});
