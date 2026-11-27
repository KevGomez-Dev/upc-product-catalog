require('reflect-metadata');
const assert = require('node:assert/strict');
const {
  readApiEnvironment,
  readDatabaseUrl,
} = require('../dist/config/environment.js');
const { databaseOptions } = require('../dist/database/database-options.js');

const validSecret = 'test-only-0123456789abcdef0123456789abcdef';
const testDatabaseUrl = 'postgresql://test:test@localhost:5432/catalog_test';

test('usa los puertos y el vencimiento documentados por defecto', () => {
  const config = readApiEnvironment({ JWT_SECRET: validSecret });
  assert.equal(config.port, 3000);
  assert.equal(config.jwtExpiresInSeconds, 3600);
});

test('acepta un puerto y un vencimiento de entorno explícitos', () => {
  const config = readApiEnvironment({
    JWT_SECRET: validSecret,
    JWT_EXPIRES_IN: '15m',
    API_PORT: '3100',
  });
  assert.equal(config.port, 3100);
  assert.equal(config.jwtExpiresInSeconds, 900);
});

test('rechaza un secreto faltante o de ejemplo y valores inválidos', () => {
  assert.throws(() => readApiEnvironment({}), /JWT_SECRET/);
  assert.throws(
    () => readApiEnvironment({ JWT_SECRET: 'cambia-este-secreto' }),
    /JWT_SECRET/,
  );
  for (const API_PORT of ['0', '65536', '1e3', '3000.5']) {
    assert.throws(
      () => readApiEnvironment({ API_PORT, JWT_SECRET: validSecret }),
      /API_PORT/,
    );
  }
  for (const JWT_EXPIRES_IN of ['0h', '1', '1w', '999999999999999999d']) {
    assert.throws(
      () => readApiEnvironment({ JWT_SECRET: validSecret, JWT_EXPIRES_IN }),
      /JWT_EXPIRES_IN/,
    );
  }
});

test('valida PostgreSQL y exige ejecutar las migraciones expresamente', () => {
  assert.throws(() => readDatabaseUrl({}), /DATABASE_URL/);
  for (const DATABASE_URL of [
    'https://localhost/catalog',
    'postgres://localhost',
    'invalida',
  ]) {
    assert.throws(() => readDatabaseUrl({ DATABASE_URL }), /DATABASE_URL/);
  }
  const options = databaseOptions({ DATABASE_URL: testDatabaseUrl });
  assert.equal(options.type, 'postgres');
  assert.equal(options.url, testDatabaseUrl);
  assert.equal(options.synchronize, false);
  assert.equal(options.migrationsRun, false);
});
