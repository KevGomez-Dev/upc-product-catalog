jest.mock('pg', () => ({ Client: jest.fn() }));

const { env } = require('node:process');
const { Client } = require('pg');
const { HealthService } = require('../dist/health/health.service.js');

const priorUrl = env.DATABASE_URL;
let client;

beforeEach(() => {
  env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:5432/fixture';
  client = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    end: jest.fn().mockResolvedValue(undefined),
  };
  Client.mockReset().mockReturnValue(client);
});

afterEach(() => {
  if (priorUrl === undefined) delete env.DATABASE_URL;
  else env.DATABASE_URL = priorUrl;
  jest.useRealTimers();
});

test('ejecuta una consulta realista y comparte una sola comprobación simultánea', async () => {
  const service = new HealthService();
  expect(
    await Promise.all([service.checkDatabase(), service.checkDatabase()]),
  ).toEqual([true, true]);
  expect(Client).toHaveBeenCalledTimes(1);
  expect(client.query).toHaveBeenCalledWith('SELECT 1');
  expect(client.end).toHaveBeenCalledTimes(1);
});

test('una desconexión produce false y la siguiente comprobación puede recuperarse', async () => {
  client.connect.mockRejectedValueOnce(new Error('fixture privado'));
  const service = new HealthService();
  expect(await service.checkDatabase()).toBe(false);
  expect(await service.checkDatabase()).toBe(true);
  expect(client.end).toHaveBeenCalledTimes(2);
});

test('el plazo global devuelve false y cierra una conexión sin respuesta', async () => {
  jest.useFakeTimers();
  client.query.mockReturnValueOnce(new Promise(() => {}));
  const check = new HealthService().checkDatabase();
  await jest.advanceTimersByTimeAsync(1500);
  expect(await check).toBe(false);
  expect(client.end).toHaveBeenCalledTimes(1);
});
