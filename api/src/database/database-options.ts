import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import { readDatabaseUrl } from '../config/environment';
import { Category } from './entities/category.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { ImportRow } from './entities/import-row.entity';
import { Product } from './entities/product.entity';
import { Subcategory } from './entities/subcategory.entity';
import { User } from './entities/user.entity';

export function databaseOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
  return {
    type: 'postgres',
    url: readDatabaseUrl(env),
    entities: [Category, Subcategory, Product, User, ImportBatch, ImportRow],
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    migrations: [join(__dirname, 'migrations', '*.js')],
    connectTimeoutMS: 5000,
  };
}
