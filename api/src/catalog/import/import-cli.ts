import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { DataSource } from 'typeorm';
import { loadLocalEnvironment } from '../../config/environment';
import { databaseOptions } from '../../database/database-options';
import { persistCatalog } from './persist-catalog';
import { inspectCatalog, reviewCatalog } from './review-catalog';

const usage =
  'npm run catalog:import -w api -- <inspect|load> [--file ruta.csv]';

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      file: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  const [mode] = positionals;
  if (positionals.length !== 1 || (mode !== 'inspect' && mode !== 'load')) {
    throw new Error(usage);
  }

  const path = values.file
    ? resolve(process.env.INIT_CWD ?? process.cwd(), values.file)
    : resolve(__dirname, '../../../../data/productos.csv');
  const review = reviewCatalog(await readFile(path));
  const base = { mode, source: basename(path), sha256: review.sha256 };

  if (mode === 'inspect') {
    const rows = review.rows.map((row) => ({
      ...row,
      status: row.product
        ? 'projectable'
        : row.duplicateOfLine !== undefined
          ? 'duplicate'
          : 'pending',
    }));
    printReport({ ...base, projected: inspectCatalog(review) }, rows);
    return;
  }

  loadLocalEnvironment();
  const dataSource = await new DataSource(
    databaseOptions(process.env),
  ).initialize();
  try {
    const result = await persistCatalog(dataSource, basename(path), review);
    const { summary, id, rulesVersion } = result.batch;
    printReport(
      {
        ...base,
        batchId: id,
        rulesVersion,
        reused: result.reused,
        summary,
        writes: result.reused
          ? {
              batches: 0,
              rows: 0,
              categories: 0,
              subcategories: 0,
              products: 0,
              users: 0,
            }
          : {
              batches: 1,
              rows: summary.rows,
              categories: summary.categories,
              subcategories: summary.subcategories,
              products: summary.products,
              users: summary.users,
            },
      },
      result.rows,
    );
  } finally {
    await dataSource.destroy();
  }
}

type ReportRow = {
  lineStart: number;
  lineEnd: number;
  originalId: string | null;
  status: string;
  diagnostics: unknown[];
  normalizations: unknown[];
};

function printReport(metadata: object, rows: ReportRow[]): void {
  const issues = rows
    .filter(
      ({ diagnostics, normalizations }) =>
        diagnostics.length || normalizations.length,
    )
    .map(
      ({
        lineStart,
        lineEnd,
        originalId,
        status,
        diagnostics,
        normalizations,
      }) => ({
        lineStart,
        lineEnd,
        originalId,
        status,
        diagnostics,
        normalizations,
      }),
    );
  console.log(JSON.stringify({ ...metadata, issues }, null, 2));
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error inesperado.';
  console.error(`No se pudo ejecutar la carga del catálogo. ${message}`);
  process.exitCode = 1;
});
