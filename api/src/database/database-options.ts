import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { readDatabaseUrl } from '../config/environment';

export function databaseOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
  return {
    type: 'postgres',
    url: readDatabaseUrl(env),
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    migrations: [join(__dirname, 'migrations', '*.js')],
    connectTimeoutMS: 5000,
  };
}
