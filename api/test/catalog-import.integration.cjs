require('reflect-metadata');
const { Buffer } = require('node:buffer');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { env } = require('node:process');
const { verify } = require('argon2');
const { DataSource } = require('typeorm');
const { persistCatalog } = require('../dist/catalog/import/persist-catalog.js');
const { reviewCatalog } = require('../dist/catalog/import/review-catalog.js');
const { databaseOptions } = require('../dist/database/database-options.js');

const source = readFileSync(resolve(__dirname, '../../data/productos.csv'));
const review = reviewCatalog(source);
const schema = `upc_test_${randomBytes(8).toString('hex')}`;
let adminConnection;
let database;
let loaded;
let repeated;

beforeAll(async () => {
  if (!env.TEST_DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL debe apuntar a una instancia PostgreSQL aislada.',
    );
  }
  const options = databaseOptions({ DATABASE_URL: env.TEST_DATABASE_URL });
  adminConnection = await new DataSource({
    ...options,
    entities: [],
    migrations: [],
  }).initialize();
  await adminConnection.query(`CREATE SCHEMA "${schema}"`);
  database = await new DataSource({
    ...options,
    schema,
    extra: { options: `-c search_path=${schema}` },
  }).initialize();
  expect(await database.runMigrations()).toHaveLength(2);

  const imports = await Promise.all([
    persistCatalog(database, 'productos.csv', review),
    persistCatalog(database, 'productos.csv', review),
  ]);
  loaded = imports.find(({ reused }) => !reused);
  repeated = imports.find(({ reused }) => reused);
});

afterAll(async () => {
  if (database?.isInitialized) await database.destroy();
  if (adminConnection?.isInitialized) {
    try {
      await adminConnection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await adminConnection.destroy();
    }
  }
});

test('la carga conserva todos los registros y solo proyecta productos válidos', async () => {
  expect(repeated.batch.id).toBe(loaded.batch.id);
  expect(loaded.batch.summary).toEqual({
    rows: 120,
    products: 106,
    duplicates: 1,
    pending: 13,
    categories: 5,
    subcategories: 17,
    users: 2,
    warnings: 1,
    normalizations: 3,
  });
  expect(repeated.rows).toEqual(loaded.rows);
  const records = source
    .toString('utf8')
    .split(/\r\n|\n|\r/)
    .slice(1, 121);
  const stored = await database.query(
    'SELECT raw_record, status, line_start FROM import_rows ORDER BY line_start',
  );
  expect(stored.map(({ raw_record }) => raw_record)).toEqual(records);
  expect(
    stored
      .filter(({ status }) => status === 'pending')
      .map(({ line_start }) => line_start),
  ).toEqual([10, 11, 32, 39, 45, 76, 81, 86, 91, 101, 106, 111, 116]);
  expect(
    await database.query(
      'SELECT line_start, duplicate_of_line FROM import_rows WHERE status = $1',
      ['duplicate'],
    ),
  ).toEqual([{ line_start: 17, duplicate_of_line: 3 }]);
  expect(
    await database.query(`
    SELECT p.upc_code, p.upc_description, p.date_added, s.code, c.code AS category
    FROM products p JOIN subcategories s ON s.id = p.subcategory_id
    JOIN categories c ON c.code = s.category_code
    WHERE p.upc_code = '010433218194'
  `),
  ).toEqual([
    {
      upc_code: '010433218194',
      upc_description: 'Agua Mineral 1.5L',
      date_added: new Date('2026-03-10T15:20:00Z'),
      code: 'BEB-AGU',
      category: 'BEB',
    },
  ]);
  expect(
    await database.query(`
    SELECT (SELECT count(*)::int FROM categories) categories,
           (SELECT count(*)::int FROM subcategories) subcategories,
           (SELECT count(*)::int FROM products) products,
           (SELECT count(*)::int FROM users) users,
           (SELECT count(*)::int FROM import_batches) batches,
           (SELECT count(*)::int FROM import_rows) rows
  `),
  ).toEqual([
    {
      categories: 5,
      subcategories: 17,
      products: 106,
      users: 2,
      batches: 1,
      rows: 120,
    },
  ]);
});

test('PostgreSQL rechaza UPC duplicado o inválido y referencias o roles inválidos', async () => {
  await expect(
    database.query(`
    UPDATE products SET upc_code = '010433218194' WHERE upc_code = '795106933306'
  `),
  ).rejects.toMatchObject({
    code: '23505',
    constraint: 'uq_products_upc_code',
  });
  await expect(
    database.query(`
    UPDATE products SET upc_code = 'ABCDEFGHIJKL' WHERE upc_code = '010433218194'
  `),
  ).rejects.toMatchObject({
    code: '23514',
    constraint: 'ck_products_upc_code',
  });
  await expect(
    database.query(`
    UPDATE products SET subcategory_id = -1 WHERE upc_code = '010433218194'
  `),
  ).rejects.toMatchObject({
    code: '23503',
    constraint: 'fk_products_subcategory',
  });
  await expect(
    database.query(`
    UPDATE subcategories SET category_code = '_MISSING_' WHERE code = 'BEB-AGU'
  `),
  ).rejects.toMatchObject({
    code: '23503',
    constraint: 'fk_subcategories_category',
  });
  await expect(
    database.query(`
    UPDATE import_rows SET duplicate_of_line = 2 WHERE status = 'pending'
  `),
  ).rejects.toMatchObject({
    code: '23514',
    constraint: 'ck_import_rows_duplicate',
  });
  await expect(
    database.query(`
    UPDATE users SET role = 'owner' WHERE username = 'admin@prueba.local'
  `),
  ).rejects.toMatchObject({ code: '23514', constraint: 'ck_users_role' });
});

test('las cuentas demo tienen hashes Argon2id verificables y no hay cuentas de actores históricos', async () => {
  const users = await database.query(
    'SELECT username, role, password_hash FROM users ORDER BY username',
  );
  expect(users.map(({ username, role }) => [username, role])).toEqual([
    ['admin@prueba.local', 'admin'],
    ['manager@prueba.local', 'manager'],
  ]);
  for (const [index, password] of ['Admin123!', 'Manager123!'].entries()) {
    expect(users[index].password_hash).toMatch(/^\$argon2id\$/);
    expect(await verify(users[index].password_hash, password)).toBe(true);
  }
});

test('el replay y un archivo equivalente con otro SHA preservan ediciones, bajas y usuarios', async () => {
  await database.query(`UPDATE products SET upc_description = 'Nombre editado', upc_code = '123456789012'
    WHERE upc_code = '010433218194'`);
  await database.query(`DELETE FROM products WHERE upc_code = '795106933306'`);
  await database.query(
    "UPDATE users SET role = 'manager' WHERE username = 'admin@prueba.local'",
  );
  const account = await database.query(
    "SELECT role, password_hash FROM users WHERE username = 'admin@prueba.local'",
  );

  const replay = await persistCatalog(database, 'mismo-contenido.csv', review);
  expect(replay.reused).toBe(true);
  expect(replay.batch.id).toBe(loaded.batch.id);
  const crlf = Buffer.from(source.toString('utf8').replace(/\r?\n/g, '\r\n'));
  const variant = await persistCatalog(
    database,
    'otro-salto-de-linea.csv',
    reviewCatalog(crlf),
  );
  expect(variant.reused).toBe(false);
  expect(variant.batch.summary).toMatchObject({
    products: 0,
    users: 0,
    pending: 119,
  });

  expect(
    await database.query(`SELECT upc_code, upc_description FROM products
    WHERE upc_code IN ('010433218194', '795106933306', '123456789012')`),
  ).toEqual([{ upc_code: '123456789012', upc_description: 'Nombre editado' }]);
  expect(
    await database.query(
      `SELECT role, password_hash FROM users WHERE username = 'admin@prueba.local'`,
    ),
  ).toEqual(account);
  expect(
    await database.query(`SELECT count(*)::int AS count FROM products`),
  ).toEqual([{ count: 105 }]);
});

test('el UPC que ya existe fuera de un lote queda pendiente y el producto intacto', async () => {
  await database.query(`
    INSERT INTO products (upc_code, upc_description, subcategory_id, date_added, updated_date, added_by, modified_by)
    SELECT '000000000000', 'Alta anterior', id, now(), now(), 'operador', 'operador'
    FROM subcategories WHERE category_code = 'BEB' AND code = 'BEB-AGU'
  `);
  const header = source.toString('utf8').split(/\r?\n/)[0];
  const csv = Buffer.from(
    `${header}\n1,CSV alternativo,000000000000,BEB,BEB-AGU,2026-02-01T00:00:00Z,2026-02-01T00:00:00Z,actor,actor`,
  );
  const result = await persistCatalog(
    database,
    'existente.csv',
    reviewCatalog(csv),
  );
  expect(result.batch.summary).toMatchObject({ products: 0, pending: 1 });
  expect(result.rows[0]).toMatchObject({
    status: 'pending',
    diagnostics: [{ code: 'EXISTING_UPC' }],
  });
  expect(
    await database.query(
      "SELECT upc_description FROM products WHERE upc_code = '000000000000'",
    ),
  ).toEqual([{ upc_description: 'Alta anterior' }]);
});

test('un fallo de PostgreSQL a mitad de la persistencia revierte todo el lote', async () => {
  const before = await database.query(
    'SELECT count(*)::int AS count FROM import_rows',
  );
  await database.query(
    'ALTER TABLE import_rows ADD CONSTRAINT test_abort CHECK (line_start <> 120) NOT VALID',
  );
  try {
    const variant = reviewCatalog(
      Buffer.from('\ufeff' + source.toString('utf8')),
    );
    await expect(
      persistCatalog(database, 'bom.csv', variant),
    ).rejects.toMatchObject({ code: '23514', constraint: 'test_abort' });
    expect(
      await database.query('SELECT count(*)::int AS count FROM import_rows'),
    ).toEqual(before);
    expect(
      await database.query(
        'SELECT id FROM import_batches WHERE source_sha256 = $1',
        [variant.sha256],
      ),
    ).toEqual([]);
  } finally {
    await database.query('ALTER TABLE import_rows DROP CONSTRAINT test_abort');
  }
});

test('las dos migraciones se pueden revertir y reaplicar en el esquema aislado', async () => {
  await database.undoLastMigration();
  await database.undoLastMigration();
  expect(
    await database.query(
      "SELECT to_regclass('products') AS products, to_regclass('import_rows') AS rows",
    ),
  ).toEqual([{ products: null, rows: null }]);
  expect(await database.runMigrations()).toHaveLength(2);
});
