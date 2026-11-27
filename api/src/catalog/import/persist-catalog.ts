import { argon2id, hash } from 'argon2';
import type { DataSource, EntityManager } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { ImportBatch } from '../../database/entities/import-batch.entity';
import { ImportRow } from '../../database/entities/import-row.entity';
import { Product } from '../../database/entities/product.entity';
import { Subcategory } from '../../database/entities/subcategory.entity';
import { User, type UserRole } from '../../database/entities/user.entity';
import { classificationKey, collectClassifications } from './classification';
import type { CatalogReview, ImportStatus } from './import.types';
import { inspectCatalog } from './review-catalog';

const rulesVersion = 1;

// Public demo fixtures supplied by the exercise. Only their hashes are persisted.
const demoUsers: { username: string; password: string; role: UserRole }[] = [
  { username: 'admin@prueba.local', password: 'Admin123!', role: 'admin' },
  {
    username: 'manager@prueba.local',
    password: 'Manager123!',
    role: 'manager',
  },
];

async function seedDemoUsers(manager: EntityManager): Promise<number> {
  const users = manager.getRepository(User);
  let created = 0;
  for (const { username, password, role } of demoUsers) {
    if (await users.existsBy({ username })) continue;

    const passwordHash = await hash(password, { type: argon2id });
    const result = await users
      .createQueryBuilder()
      .insert()
      .values({ username, passwordHash, role })
      .onConflict('("username") DO NOTHING')
      .returning('id')
      .execute();
    created += (result.raw as { id: number }[]).length;
  }
  return created;
}

export async function persistCatalog(
  dataSource: DataSource,
  sourceName: string,
  review: CatalogReview,
) {
  return dataSource.transaction('READ COMMITTED', async (manager) => {
    // Serialize imports, including different files. The UPC constraint also
    // arbitrates concurrent writes from outside the importer.
    await manager.query(
      'LOCK TABLE import_batches IN SHARE ROW EXCLUSIVE MODE',
    );
    const batches = manager.getRepository(ImportBatch);
    const rows = manager.getRepository(ImportRow);
    const existing = await batches.findOneBy({ sourceSha256: review.sha256 });
    if (existing) {
      return {
        batch: existing,
        reused: true,
        rows: await rows.find({
          where: { batchId: existing.id },
          order: { lineStart: 'ASC' },
        }),
      };
    }

    const historical = await rows.find({
      where: { status: 'imported' },
      select: { sourceFields: true },
    });
    const previouslyImported = new Set(
      historical.map(({ sourceFields }) => sourceFields[2].trim()),
    );
    const planned = review.rows.flatMap(({ product }) =>
      product ? [product] : [],
    );
    const taxonomy = collectClassifications(planned);
    const summary = {
      ...inspectCatalog(review),
      categories: 0,
      subcategories: 0,
      products: 0,
    };
    const batch = await batches.save({
      sourceName,
      sourceSha256: review.sha256,
      rulesVersion,
      summary,
    });

    for (const code of taxonomy.categories) {
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Category)
        .values({ code })
        .onConflict('("code") DO NOTHING')
        .returning('code')
        .execute();
      summary.categories += (result.raw as { code: string }[]).length;
    }

    const subcategories = manager.getRepository(Subcategory);
    const subcategoryIds = new Map<string, number>();
    for (const {
      categoryCode,
      subcategoryCode: code,
    } of taxonomy.subcategories) {
      const result = await subcategories
        .createQueryBuilder()
        .insert()
        .values({ categoryCode, code })
        .onConflict('("category_code", "code") DO NOTHING')
        .returning('id')
        .execute();
      const [inserted] = result.raw as { id: number }[];
      summary.subcategories += inserted ? 1 : 0;
      const subcategory =
        inserted ??
        (await subcategories.findOneByOrFail({ categoryCode, code }));
      subcategoryIds.set(classificationKey(categoryCode, code), subcategory.id);
    }

    for (const row of review.rows) {
      const diagnostics = [...row.diagnostics];
      const product = row.product;
      let status: ImportStatus = product ? 'imported' : 'pending';
      if (row.duplicateOfLine !== undefined) status = 'duplicate';
      if (product && previouslyImported.has(product.upcCode)) {
        status = 'pending';
        summary.pending++;
        diagnostics.push({
          code: 'PREVIOUSLY_IMPORTED_UPC',
          field: 'UpcCode',
          severity: 'error',
        });
      }

      const stored = await rows.save({
        batchId: batch.id,
        lineStart: row.lineStart,
        lineEnd: row.lineEnd,
        rawRecord: row.rawRecord,
        sourceFields: row.sourceFields,
        originalId: row.originalId,
        duplicateOfLine: row.duplicateOfLine ?? null,
        diagnostics,
        normalizations: row.normalizations,
        status,
      });

      if (!product || status !== 'imported') continue;
      const { categoryCode, subcategoryCode, ...fields } = product;
      const subcategoryId = subcategoryIds.get(
        classificationKey(categoryCode, subcategoryCode),
      );
      if (subcategoryId === undefined) {
        throw new Error(
          `No se encontró la subcategoría de la línea ${row.lineStart}.`,
        );
      }
      const inserted = await manager
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values({ ...fields, subcategoryId, importRowId: stored.id })
        .onConflict('("upc_code") DO NOTHING')
        .returning('id')
        .execute();
      if ((inserted.raw as { id: number }[]).length) {
        summary.products++;
      } else {
        summary.pending++;
        await rows.update(stored.id, {
          status: 'pending',
          diagnostics: [
            ...diagnostics,
            { code: 'EXISTING_UPC', field: 'UpcCode', severity: 'error' },
          ],
        });
      }
    }

    summary.users = await seedDemoUsers(manager);
    await batches.update(batch.id, { summary });
    return {
      batch: { ...batch, summary },
      reused: false,
      rows: await rows.find({
        where: { batchId: batch.id },
        order: { lineStart: 'ASC' },
      }),
    };
  });
}
