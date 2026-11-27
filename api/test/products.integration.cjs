require('reflect-metadata');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { env } = require('node:process');
const { URL } = require('node:url');
const { NestFactory } = require('@nestjs/core');
const request = require('supertest');
const { DataSource } = require('typeorm');
const { AppModule } = require('../dist/app.module.js');
const { persistCatalog } = require('../dist/catalog/import/persist-catalog.js');
const { reviewCatalog } = require('../dist/catalog/import/review-catalog.js');
const { databaseOptions } = require('../dist/database/database-options.js');

const source = reviewCatalog(
  readFileSync(resolve(__dirname, '../../data/productos.csv')),
);
const payload = {
  upcCode: '012345678905',
  upcDescription: 'Agua, "edición de prueba"',
  categoryCode: 'BEB',
  subCategoryCode: 'BEB-AGU',
};
const utcSeconds = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/;
const bearer = { type: 'bearer' };
const prior = { DATABASE_URL: env.DATABASE_URL, JWT_SECRET: env.JWT_SECRET };
let adminDb;
let app;
let database;
let schema;
let http;
let tokens;

beforeAll(async () => {
  if (!env.TEST_DATABASE_URL)
    throw new Error(
      'TEST_DATABASE_URL debe apuntar a un PostgreSQL de pruebas.',
    );
  adminDb = await new DataSource({
    ...databaseOptions({ DATABASE_URL: env.TEST_DATABASE_URL }),
    entities: [],
    migrations: [],
  }).initialize();
});

beforeEach(async () => {
  schema = `upc_products_test_${randomBytes(8).toString('hex')}`;
  await adminDb.query(`CREATE SCHEMA "${schema}"`);
  const databaseUrl = new URL(env.TEST_DATABASE_URL);
  databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
  env.DATABASE_URL = databaseUrl.toString();
  env.JWT_SECRET = randomBytes(32).toString('hex');

  database = await new DataSource(databaseOptions(env)).initialize();
  await database.runMigrations();
  await persistCatalog(database, 'productos.csv', source);

  app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  await app.init();
  http = request(app.getHttpServer());
  const logins = await Promise.all([
    http
      .post('/auth/login')
      .send({ username: 'admin@prueba.local', password: 'Admin123!' })
      .expect(200),
    http
      .post('/auth/login')
      .send({ username: 'manager@prueba.local', password: 'Manager123!' })
      .expect(200),
  ]);
  tokens = {
    admin: logins[0].body.accessToken,
    manager: logins[1].body.accessToken,
  };
});

afterEach(async () => {
  try {
    await app?.close();
  } finally {
    app = undefined;
    try {
      if (database?.isInitialized) await database.destroy();
    } finally {
      database = undefined;
      if (schema && adminDb?.isInitialized)
        await adminDb.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      schema = undefined;
    }
  }
});

afterAll(async () => {
  for (const [name, value] of Object.entries(prior)) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }
  if (adminDb?.isInitialized) await adminDb.destroy();
});

function get(path, role = 'admin') {
  return http.get(path).auth(tokens[role], bearer);
}
function post(body, role = 'admin') {
  return http.post('/products').auth(tokens[role], bearer).send(body);
}
function put(id, body, role = 'admin') {
  return http.put(`/products/${id}`).auth(tokens[role], bearer).send(body);
}
function remove(id, role = 'admin') {
  return http.delete(`/products/${id}`).auth(tokens[role], bearer);
}

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toMatchObject({
    statusCode: status,
    code,
    message: expect.any(String),
    requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
  });
  return response.body;
}

async function importedProduct() {
  const [row] = await database.query(
    'SELECT id, import_row_id FROM products WHERE upc_code = $1',
    ['010433218194'],
  );
  return row;
}

test.each(['admin', 'manager'])(
  'lista, detalle y categorías de producción como %s',
  async (role) => {
    const list = (await get('/products', role).expect(200)).body;
    expect(list).toHaveLength(106);
    const ids = list.map(({ id }) => id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    const imported = list.find(({ upcCode }) => upcCode === '010433218194');
    expect(imported).toEqual({
      id: expect.any(Number),
      upcCode: '010433218194',
      upcDescription: 'Agua Mineral 1.5L',
      categoryCode: 'BEB',
      subCategoryCode: 'BEB-AGU',
      dateAdded: '2026-03-10T15:20:00Z',
      updatedDate: '2026-04-02T18:45:00Z',
    });
    expect(
      (await get(`/products/${imported.id}`, role).expect(200)).body,
    ).toEqual({ ...imported, addedBy: 'mrivera', modifiedBy: 'mrivera' });
    expect((await get('/categories', role).expect(200)).body).toEqual(
      ['BEB', 'LAC', 'LIM', 'PAN', 'SNK'].map((code) => ({ code })),
    );
    expect(
      (await get('/categories/BEB/subcategories', role).expect(200)).body,
    ).toEqual(
      ['BEB-AGU', 'BEB-ENE', 'BEB-GAS', 'BEB-JUG'].map((code) => ({
        code,
        categoryCode: 'BEB',
      })),
    );
  },
);

test('filtra por pareja existente y valida parámetros completos y exactos', async () => {
  const response = await get(
    '/products?categoryCode=BEB&subCategoryCode=BEB-AGU',
    'manager',
  ).expect(200);
  expect(response.body.length).toBeGreaterThan(0);
  expect(response.body.length).toBeLessThan(106);
  expect(
    response.body.every(
      (item) =>
        item.categoryCode === 'BEB' && item.subCategoryCode === 'BEB-AGU',
    ),
  ).toBe(true);
  const incomplete = expectError(
    await get('/products?categoryCode=BEB'),
    400,
    'VALIDATION_ERROR',
  );
  expect(incomplete.fieldErrors).toHaveProperty('subCategoryCode');
  expectError(
    await get('/products?categoryCode=BEB&subCategoryCode=LAC-LEC'),
    400,
    'INVALID_CLASSIFICATION',
  );
  expectError(await get('/products?page=1'), 400, 'VALIDATION_ERROR');
  expectError(
    await get('/categories/NO-EXISTE/subcategories'),
    404,
    'CATEGORY_NOT_FOUND',
  );
});

test('admin crea, conserva su UPC durante la edición y elimina', async () => {
  const created = await post(payload).expect(201);
  const { id } = created.body;
  expect(created.headers.location).toBe(`/products/${id}`);
  expect(created.headers['x-upc-warning']).toBeUndefined();
  expect(created.body).toEqual({
    ...payload,
    id: expect.any(Number),
    dateAdded: expect.stringMatching(utcSeconds),
    updatedDate: expect.stringMatching(utcSeconds),
    addedBy: 'admin@prueba.local',
    modifiedBy: 'admin@prueba.local',
  });
  expect(created.body.dateAdded).toBe(created.body.updatedDate);

  const edited = await put(id, {
    ...payload,
    upcDescription: 'Otra descripción',
  }).expect(200);
  expect(edited.body).toEqual({
    ...created.body,
    upcDescription: 'Otra descripción',
    updatedDate: expect.stringMatching(utcSeconds),
  });
  expect(Date.parse(edited.body.updatedDate)).toBeGreaterThanOrEqual(
    Date.parse(created.body.updatedDate),
  );
  const deleted = await remove(id).expect(204);
  expect(deleted.text).toBe('');
  expectError(await get(`/products/${id}`), 404, 'PRODUCT_NOT_FOUND');
  expectError(await remove(id), 404, 'PRODUCT_NOT_FOUND');
});

test('checksum incorrecto se guarda y se informa en la cabecera', async () => {
  const input = { ...payload, upcCode: '012345678906' };
  const created = await post(input).expect(201);
  expect(created.body.upcCode).toBe(input.upcCode);
  expect(created.headers['x-upc-warning']).toBe('UPC_CHECKSUM');
  const edited = await put(created.body.id, input).expect(200);
  expect(edited.headers['x-upc-warning']).toBe('UPC_CHECKSUM');
});

test('la edición conserva el alta histórica y atribuye la modificación al admin', async () => {
  const { id } = await importedProduct();
  const original = (await get(`/products/${id}`).expect(200)).body;
  const edited = await put(id, {
    ...payload,
    upcCode: original.upcCode,
    categoryCode: 'LAC',
    subCategoryCode: 'LAC-LEC',
  }).expect(200);
  expect(edited.body).toMatchObject({
    id,
    upcCode: original.upcCode,
    categoryCode: 'LAC',
    subCategoryCode: 'LAC-LEC',
    dateAdded: original.dateAdded,
    addedBy: original.addedBy,
    modifiedBy: 'admin@prueba.local',
    updatedDate: expect.stringMatching(utcSeconds),
  });
  expect(Date.parse(edited.body.updatedDate)).toBeGreaterThanOrEqual(
    Date.parse(original.updatedDate),
  );
  expect((await get(`/products/${id}`).expect(200)).body).toEqual(edited.body);
});

test('la edición con auditoría futura da 409 y conserva toda la fila', async () => {
  const { id } = await importedProduct();
  await database.query('UPDATE products SET updated_date = $1 WHERE id = $2', [
    '2100-01-01T00:00:00Z',
    id,
  ]);
  const before = await database.query('SELECT * FROM products WHERE id = $1', [
    id,
  ]);
  expectError(await put(id, payload), 409, 'AUDIT_DATE_CONFLICT');
  expect(
    await database.query('SELECT * FROM products WHERE id = $1', [id]),
  ).toEqual(before);
});

test('manager recibe 403 en las tres escrituras y el producto queda intacto', async () => {
  const { id } = await importedProduct();
  const before = (await get(`/products/${id}`, 'manager').expect(200)).body;
  expectError(await post(payload, 'manager'), 403, 'FORBIDDEN');
  expectError(await put(id, payload, 'manager'), 403, 'FORBIDDEN');
  expectError(await remove(id, 'manager'), 403, 'FORBIDDEN');
  expect((await get(`/products/${id}`, 'manager').expect(200)).body).toEqual(
    before,
  );
});

test('todas las rutas requieren autenticación', async () => {
  const operations = [
    http.get('/products'),
    http.get('/products/1'),
    http.post('/products').send(payload),
    http.put('/products/1').send(payload),
    http.delete('/products/1'),
    http.get('/categories'),
    http.get('/categories/BEB/subcategories'),
  ];
  for (const operation of operations)
    expectError(await operation, 401, 'UNAUTHORIZED');
});

test('rechaza identificadores inválidos y devuelve 404 para recursos inexistentes', async () => {
  for (const id of ['0', '-1', 'abc', '1e0', '1.0', '2147483648']) {
    const failure = expectError(
      await get(`/products/${id}`),
      400,
      'VALIDATION_ERROR',
    );
    expect(failure.fieldErrors).toHaveProperty('id');
  }
  expectError(await put('bad', payload), 400, 'VALIDATION_ERROR');
  expectError(await remove('bad'), 400, 'VALIDATION_ERROR');
  expectError(await get('/products/999999'), 404, 'PRODUCT_NOT_FOUND');
  expectError(await put(999999, payload), 404, 'PRODUCT_NOT_FOUND');
  expectError(await remove(999999), 404, 'PRODUCT_NOT_FOUND');
});

test('DTO exige campos y rechaza UPC incorrecto, descripción vacía y auditoría ajena', async () => {
  const required = expectError(await post({}), 400, 'VALIDATION_ERROR');
  expect(Object.keys(required.fieldErrors).sort()).toEqual([
    'categoryCode',
    'subCategoryCode',
    'upcCode',
    'upcDescription',
  ]);
  for (const upcCode of [
    123456789012,
    '123',
    '01234567890x',
    '０12345678905',
    '012345678905 ',
  ]) {
    expect(
      expectError(await post({ ...payload, upcCode }), 400, 'VALIDATION_ERROR')
        .fieldErrors,
    ).toHaveProperty('upcCode');
  }
  expect(
    expectError(
      await post({ ...payload, upcDescription: '   ' }),
      400,
      'VALIDATION_ERROR',
    ).fieldErrors,
  ).toHaveProperty('upcDescription');
  const forged = {
    dateAdded: '2000-01-01T00:00:00Z',
    updatedDate: '2000-01-01T00:00:00Z',
    addedBy: 'spoof',
    modifiedBy: 'spoof',
    id: 2,
  };
  const { id } = await importedProduct();
  expect(
    expectError(await post({ ...payload, ...forged }), 400, 'VALIDATION_ERROR')
      .fieldErrors,
  ).toHaveProperty('_request');
  expect(
    expectError(
      await put(id, { ...payload, ...forged }),
      400,
      'VALIDATION_ERROR',
    ).fieldErrors,
  ).toHaveProperty('_request');
  expectError(
    await put(id, { upcCode: payload.upcCode }),
    400,
    'VALIDATION_ERROR',
  );
});

test('rechaza categoría inexistente, subcategoría inexistente o pareja incompatible', async () => {
  for (const [classification, field] of [
    [{ categoryCode: 'NO-EXISTE' }, 'categoryCode'],
    [{ categoryCode: 'beb' }, 'categoryCode'],
    [{ subCategoryCode: 'BEB-OTRA' }, 'subCategoryCode'],
    [{ subCategoryCode: 'LAC-LEC' }, 'subCategoryCode'],
  ]) {
    expect(
      expectError(
        await post({ ...payload, ...classification }),
        400,
        'INVALID_CLASSIFICATION',
      ).fieldErrors,
    ).toHaveProperty(field);
  }
  const { id } = await importedProduct();
  expectError(
    await put(id, { ...payload, subCategoryCode: 'LAC-LEC' }),
    400,
    'INVALID_CLASSIFICATION',
  );
});

test('UPC duplicado falla con 409 al crear y actualizar', async () => {
  const { id } = await importedProduct();
  const duplicate = { ...payload, upcCode: '795106933306' };
  for (const response of [await post(duplicate), await put(id, duplicate)]) {
    expect(
      expectError(response, 409, 'UPC_CONFLICT').fieldErrors,
    ).toHaveProperty('upcCode');
  }
  expect((await get(`/products/${id}`).expect(200)).body.upcCode).toBe(
    '010433218194',
  );
});

test('dos altas concurrentes con el mismo UPC producen exactamente un 201 y un 409', async () => {
  const responses = await Promise.all([
    post(payload),
    post({ ...payload, upcDescription: 'Alta concurrente' }),
  ]);
  expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
  expectError(
    responses.find(({ status }) => status === 409),
    409,
    'UPC_CONFLICT',
  );
  expect(
    await database.query(
      'SELECT count(*)::int AS count FROM products WHERE upc_code = $1',
      [payload.upcCode],
    ),
  ).toEqual([{ count: 1 }]);
});

test('borrado físico conserva el registro original y reimportar no restaura el producto', async () => {
  const { id, import_row_id: rowId } = await importedProduct();
  const original = await database.query(
    'SELECT * FROM import_rows WHERE id = $1',
    [rowId],
  );
  expect(original).toHaveLength(1);
  await remove(id).expect(204);
  expect(
    await database.query('SELECT * FROM import_rows WHERE id = $1', [rowId]),
  ).toEqual(original);
  const replay = await persistCatalog(database, 'productos.csv', source);
  expect(replay.reused).toBe(true);
  expect(
    await database.query('SELECT id FROM products WHERE upc_code = $1', [
      '010433218194',
    ]),
  ).toEqual([]);
  expectError(await get(`/products/${id}`), 404, 'PRODUCT_NOT_FOUND');
});

test('un fallo inesperado de PostgreSQL conserva 500 y oculta información interna', async () => {
  await database.query(
    `ALTER TABLE products ADD CONSTRAINT test_write_failure CHECK (upc_description <> 'fixture internal detail')`,
  );
  const response = await post({
    ...payload,
    upcDescription: 'fixture internal detail',
  });
  expectError(response, 500, 'INTERNAL_ERROR');
  expect(response.text).not.toMatch(
    /test_write_failure|fixture internal detail|INSERT INTO|stack/,
  );
});
