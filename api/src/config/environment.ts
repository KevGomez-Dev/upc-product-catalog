import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const rootEnvFile = resolve(__dirname, '../../../.env');

export function loadLocalEnvironment(): void {
  if (existsSync(rootEnvFile)) {
    loadEnvFile(rootEnvFile);
  }
}

export function readDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL es obligatoria.');
  }

  const parsed = URL.parse(databaseUrl);
  if (
    !parsed?.hostname ||
    parsed.pathname.length <= 1 ||
    !['postgresql:', 'postgres:'].includes(parsed.protocol)
  ) {
    throw new Error(
      'DATABASE_URL debe indicar un servidor y una base PostgreSQL.',
    );
  }

  return databaseUrl;
}

export function readApiEnvironment(env: NodeJS.ProcessEnv) {
  const rawPort = env.API_PORT ?? '3000';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65535) {
    throw new Error('API_PORT debe ser un entero entre 1 y 65535.');
  }

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || Buffer.byteLength(jwtSecret.trim(), 'utf8') < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 bytes.');
  }

  const expiration = env.JWT_EXPIRES_IN ?? '1h';
  const duration = /^([1-9]\d*)([smhd])$/.exec(expiration);
  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  const jwtExpiresInSeconds = duration
    ? Number(duration[1]) * secondsPerUnit[duration[2]]
    : Number.NaN;

  if (!Number.isSafeInteger(jwtExpiresInSeconds)) {
    throw new Error(
      'JWT_EXPIRES_IN debe ser una duración positiva, por ejemplo 1h.',
    );
  }

  return { port, jwtSecret, jwtExpiresInSeconds };
}
