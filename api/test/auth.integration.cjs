require('reflect-metadata');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { env } = require('node:process');
const { URL } = require('node:url');
const { Controller, Get, Logger, Post } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { Test } = require('@nestjs/testing');
const { argon2id, hash } = require('argon2');
const request = require('supertest');
const { DataSource } = require('typeorm');
const { AppModule } = require('../dist/app.module.js');
const { Roles } = require('../dist/auth/auth.decorators.js');
const { jwtAudience, jwtIssuer } = require('../dist/auth/auth.identity.js');
const { persistCatalog } = require('../dist/catalog/import/persist-catalog.js');
const { reviewCatalog } = require('../dist/catalog/import/review-catalog.js');
const { databaseOptions } = require('../dist/database/database-options.js');

class AuthorizationProbe {
  read() {
    return { allowed: true };
  }
  write() {
    return { allowed: true };
  }
  undeclared() {
    return { allowed: true };
  }
  failure() {
    throw new Error('Synthetic sensitive stack and SQL marker');
  }
}

Controller('__auth-test')(AuthorizationProbe);
function decorateProbe(method, ...decorators) {
  const prototype = AuthorizationProbe.prototype;
  Reflect.decorate(
    decorators,
    prototype,
    method,
    Object.getOwnPropertyDescriptor(prototype, method),
  );
}
decorateProbe('read', Get('read'), Roles('admin', 'manager'));
decorateProbe('write', Post('write'), Roles('admin'));
decorateProbe('undeclared', Post('undeclared'));
decorateProbe('failure', Get('failure'), Roles('admin'));

const schema = `upc_auth_test_${randomBytes(8).toString('hex')}`;
const testSecret = randomBytes(32).toString('hex');
const otherSecret = randomBytes(32).toString('hex');
const jwt = new JwtService();
const admin = { username: 'admin@prueba.local', password: 'Admin123!' };
const manager = { username: 'manager@prueba.local', password: 'Manager123!' };
const whitespaceAccount = {
  username: 'spaces-fixture@prueba.local',
  password: '  Contraseña literal  ',
};
const prior = Object.fromEntries(
  ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN'].map((name) => [
    name,
    env[name],
  ]),
);
let adminDb;
let app;
let http;

beforeAll(async () => {
  if (!env.TEST_DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL debe apuntar a un PostgreSQL de pruebas.',
    );
  }
  const connectionUrl = new URL(env.TEST_DATABASE_URL);
  adminDb = await new DataSource({
    ...databaseOptions({ DATABASE_URL: env.TEST_DATABASE_URL }),
    entities: [],
    migrations: [],
  }).initialize();
  await adminDb.query(`CREATE SCHEMA "${schema}"`);
  connectionUrl.searchParams.set('options', `-c search_path=${schema}`);
  env.DATABASE_URL = connectionUrl.toString();
  env.JWT_SECRET = testSecret;
  delete env.JWT_EXPIRES_IN;

  const seed = await new DataSource(databaseOptions(env)).initialize();
  try {
    await seed.runMigrations();
    const contents = readFileSync(
      resolve(__dirname, '../../data/productos.csv'),
    );
    const { batch } = await persistCatalog(
      seed,
      'productos.csv',
      reviewCatalog(contents),
    );
    expect(batch.summary.users).toBe(2);
    await seed.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [
        whitespaceAccount.username,
        await hash(whitespaceAccount.password, { type: argon2id }),
        'manager',
      ],
    );
  } finally {
    await seed.destroy();
  }
});

beforeEach(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [AuthorizationProbe],
  }).compile();
  app = module.createNestApplication({ logger: false });
  await app.init();
  http = request(app.getHttpServer());
});

afterEach(async () => {
  await app?.close();
  app = undefined;
});

afterAll(async () => {
  for (const [name, value] of Object.entries(prior)) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }
  if (adminDb?.isInitialized) {
    try {
      await adminDb.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await adminDb.destroy();
    }
  }
});

function login(credentials) {
  return http.post('/auth/login').send(credentials);
}

function sign(claims = {}, options = {}) {
  const signOptions = {
    secret: testSecret,
    algorithm: 'HS256',
    issuer: jwtIssuer,
    audience: jwtAudience,
    expiresIn: 60,
    ...options,
  };
  if (signOptions.expiresIn === undefined) delete signOptions.expiresIn;
  return jwt.sign({ sub: '1', role: 'admin', ...claims }, signOptions);
}

function expectError(response, status, code) {
  expect(response.status).toBe(status);
  expect(response.body).toMatchObject({
    statusCode: status,
    code,
    message: expect.any(String),
    requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
  });
  expect(response.body).not.toHaveProperty('stack');
  expect(response.body).not.toHaveProperty('passwordHash');
  return response.body;
}

test.each([
  ['admin', admin],
  ['manager', manager],
])(
  'login de %s demo y GET /auth/me contra PostgreSQL',
  async (role, account) => {
    const authenticated = await login(account).expect(200);
    expect(authenticated.headers['cache-control']).toBe('no-store');
    expect(Object.keys(authenticated.body)).toEqual(['accessToken']);
    const { accessToken } = authenticated.body;
    const { header, payload } = jwt.decode(accessToken, { complete: true });
    expect(header.alg).toBe('HS256');
    expect(Object.keys(payload).sort()).toEqual([
      'aud',
      'exp',
      'iat',
      'iss',
      'role',
      'sub',
    ]);
    expect(payload).toMatchObject({
      role,
      iss: jwtIssuer,
      aud: jwtAudience,
      sub: expect.stringMatching(/^[1-9][0-9]*$/),
    });
    expect(payload.exp - payload.iat).toBe(3600);

    const me = await http
      .get('/auth/me')
      .auth(accessToken, { type: 'bearer' })
      .expect(200);
    expect(me.body).toEqual({
      id: Number(payload.sub),
      username: account.username,
      role,
    });
    expect(me.headers['cache-control']).toBe('no-store');
  },
);

test('login distingue espacios de la contraseña y acepta el usuario normalizado', async () => {
  await login({
    ...whitespaceAccount,
    password: whitespaceAccount.password.trim(),
  }).expect(401);
  await login({
    ...whitespaceAccount,
    username: ' SPACES-FIXTURE@PRUEBA.LOCAL ',
  }).expect(200);
});

test('un usuario inexistente y una contraseña incorrecta producen el mismo error genérico', async () => {
  const badPassword = 'contraseña-invalida';
  const wrong = expectError(
    await login({ ...admin, password: badPassword }),
    401,
    'INVALID_CREDENTIALS',
  );
  const absent = expectError(
    await login({ username: 'unknown@prueba.local', password: badPassword }),
    401,
    'INVALID_CREDENTIALS',
  );
  expect(wrong.message).toBe(absent.message);
  expect(wrong.requestId).not.toBe(absent.requestId);
  expect(JSON.stringify([wrong, absent])).not.toContain(badPassword);
  expect(JSON.stringify([wrong, absent])).not.toContain('unknown@prueba.local');
});

test('el DTO rechaza tipos, campos faltantes, longitudes y propiedades ajenas', async () => {
  const cases = [
    [{ password: 123 }, ['username', 'password']],
    [{ username: ' ', password: 'a' }, ['username']],
    [
      { username: 'x'.repeat(255), password: 'q'.repeat(257) },
      ['username', 'password'],
    ],
    [{ ...admin, unexpected: 'Sensitive raw body value' }, ['_request']],
    [[admin], ['_request']],
  ];
  for (const [data, fields] of cases) {
    const error = expectError(await login(data), 400, 'VALIDATION_ERROR');
    expect(Object.keys(error.fieldErrors)).toEqual(
      expect.arrayContaining(fields),
    );
    expect(JSON.stringify(error)).not.toContain('Sensitive raw body value');
    expect(JSON.stringify(error)).not.toContain(admin.password);
  }
});

test('el JSON inválido produce 400 controlado sin repetir el cuerpo', async () => {
  const response = await http
    .post('/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"password":"sensitive malformed body",');
  expectError(response, 400, 'BAD_REQUEST');
  expect(response.text).not.toContain('sensitive malformed body');
});

test('token ausente y cabecera inválida producen 401', async () => {
  const absent = await http.get('/auth/me');
  expectError(absent, 401, 'UNAUTHORIZED');
  expect(absent.headers['www-authenticate']).toBe('Bearer');
  expectError(
    await http.get('/auth/me').set('Authorization', 'Bearer invalid'),
    401,
    'UNAUTHORIZED',
  );
});

test.each([
  ['expirado', {}, { expiresIn: -1 }],
  ['firmado con otro secreto', {}, { secret: otherSecret }],
  ['con HS384', {}, { algorithm: 'HS384' }],
  ['de otro emisor', {}, { issuer: 'issuer-de-prueba' }],
  ['de otra audiencia', {}, { audience: 'audiencia-de-prueba' }],
  ['sin expiración', {}, { expiresIn: undefined }],
  ['sin iat', {}, { noTimestamp: true }],
  ['con rol inválido', { role: 'owner' }, {}],
  ['con identificador no canónico', { sub: '1e0' }, {}],
  ['con identificador de otro tipo', { sub: 1 }, {}],
])('rechaza un token %s', async (_name, claims, options) => {
  const token = sign(claims, options);
  const response = await http
    .get('/auth/me')
    .auth(token, { type: 'bearer' })
    .set('X-Jwt-Secret', otherSecret);
  expectError(response, 401, 'UNAUTHORIZED');
  expect(response.text).not.toContain(token);
  expect(response.text).not.toContain(otherSecret);
});

test('los guardias globales permiten consultas y reservan las mutaciones declaradas al admin', async () => {
  const [{ body: adminSession }, { body: managerSession }] = await Promise.all([
    login(admin).expect(200),
    login(manager).expect(200),
  ]);
  const bearer = { type: 'bearer' };
  const adminToken = adminSession.accessToken;
  const managerToken = managerSession.accessToken;
  expectError(await http.get('/__auth-test/read'), 401, 'UNAUTHORIZED');
  await http.get('/__auth-test/read').auth(adminToken, bearer).expect(200);
  await http.get('/__auth-test/read').auth(managerToken, bearer).expect(200);
  await http.post('/__auth-test/write').auth(adminToken, bearer).expect(201);
  expectError(
    await http.post('/__auth-test/write').auth(managerToken, bearer),
    403,
    'FORBIDDEN',
  );
  expectError(
    await http.post('/__auth-test/undeclared').auth(adminToken, bearer),
    403,
    'FORBIDDEN',
  );
});

test('un error inesperado responde 500 con correlación y excluye información interna de los logs', async () => {
  const logging = jest
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => {});
  const token = sign();
  try {
    const response = await http
      .get('/__auth-test/failure')
      .auth(token, { type: 'bearer' });
    const body = expectError(response, 500, 'INTERNAL_ERROR');
    expect(response.text).not.toContain('Synthetic sensitive');
    expect(logging.mock.calls).toEqual([
      [`Solicitud fallida (500), requestId=${body.requestId}`],
    ]);
    expect(JSON.stringify(logging.mock.calls)).not.toContain(token);
  } finally {
    logging.mockRestore();
  }
});

test('limita intentos por IP sin confiar en X-Forwarded-For del cliente', async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    await login({
      username: `attempt-${attempt}@prueba.local`,
      password: 'incorrecta',
    }).expect(401);
  }
  const blocked = await login(admin).set('X-Forwarded-For', '192.0.2.8');
  expectError(blocked, 429, 'TOO_MANY_REQUESTS');
  expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  await http.get('/auth/me').auth(sign(), { type: 'bearer' }).expect(200);
});
